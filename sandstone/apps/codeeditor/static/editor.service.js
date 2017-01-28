'use strict';

/**
 * @ngdoc service
 * @name sandstone.EditorService
 * @description
 * # EditorService
 * Service to manage documents in the Sandstone IDE Editor.
 */
angular.module('sandstone.editor')

.factory('EditorService', ['$window', '$http', '$log', 'AceModeService', 'FilesystemService', '$rootScope', function ($window, $http,$log,AceModeService, FilesystemService, $rootScope) {
  var editor = {};

  // clipboard will hold all copy/paste text for editor
  var clipboard = '';
  /**
   * This is the object from which all values concerning open documents are derived.
   * This objects has the following format:
   * {
   *   '<filepath>': {
   *     filename: str,
   *     unsaved: boolean,
   *     active: boolean,
   *     session: obj (defined by Ace)
   *   },
   *   ...
   * }
   */
  var openDocs = {};
  var editorSettings = {
    showInvisibles: true,
    useSoftTabs: true,
    fontSize: 12,
    tabSize: 4,
    showIndentGuides: true,
    wordWrap: false
  };

  var applySettings = function () {
    editor.setShowInvisibles(editorSettings.showInvisibles);
    editor.getSession().setUseSoftTabs(editorSettings.useSoftTabs);
    editor.setFontSize(editorSettings.fontSize);
    editor.getSession().setTabSize(editorSettings.tabSize);
    editor.setDisplayIndentGuides(editorSettings.showIndentGuides);
    editor.getSession().setUseWrapMode(editorSettings.wordWrap);
  };

  $rootScope.$on('editor:open-document', function(event, data) {
      console.log(data);
      openDocument(data.filepath);
  });

  // Called when the contents of the current session have changed. Bound directly to
  // an EditSession.
  var onSessionModified = function(e) {
    var filepath = getCurrentDoc();
    openDocs[filepath].unsaved = true;
  };

  // Returns the next available filepath enumeration for untitled documents
  var getNextUntitledFilepath = function() {
    var docExists = true;
    var docEnum = 0;
    var filepath;
    while (docExists) {
      filepath = '-/untitled'+docEnum;
      if (filepath in openDocs) {
        docEnum++;
      } else {
        docExists = false;
      }
    }
    return filepath;
  };

  // Return the filepath of the active document in the editor. If no document
  // is active, return undefined.
  var getCurrentDoc = function() {
    var current;
    for (var filepath in openDocs) {
      if (openDocs.hasOwnProperty(filepath)) {
        if (openDocs[filepath].active) {
          current = filepath;
        }
      }
    }
    return current;
  };

  // Creates a new untitled document, which is added to openDocs
  var createUntitledDocument = function() {
    var filepath = getNextUntitledFilepath();
    createNewSession(filepath);
    switchSession(filepath);
  };

  // Make the document specified by filepath the active document in the editor.
  // Returns true if successful, and false if the specified document is not loaded.
  var switchSession = function(filepath) {
    var current = getCurrentDoc();

    if (filepath in openDocs) {
      if (current) {
        openDocs[current].active = false;
      }
      editor.setSession(openDocs[filepath].session);
      openDocs[filepath].active = true;
      var mode = AceModeService.getModeForPath(filepath);
      $rootScope.$emit('aceModeChanged', mode);
      openDocs[filepath].session.setMode(mode.mode);
      applySettings();
    } else {
      return false;
    }
  };

  // Creates a new EditSession, and stores a new openDoc object in openDocs.
  // content and mode are optional.
  // This function does not set the new session as active.
  var createNewSession = function(filepath,content,mode,undoManager) {
    var c = content || '';
    var m = mode || 'ace/mode/text';
    var um = undoManager || undefined;

    openDocs[filepath] = {
      filepath: filepath,
      filename: FilesystemService.basename(filepath),
      unsaved: false,
      active: false
    };
    openDocs[filepath].session = new $window.ace.createEditSession(c,m);
    openDocs[filepath].session.on('change',onSessionModified);
    if (um) {
      openDocs[filepath].session.setUndoManager(um);
    }
  };

  var openDocument = function(filepath) {
    if (typeof filepath === 'undefined') {
      // Create an untitled document, and a new editSession to associate it with.
      createUntitledDocument();
    } else {
      if (filepath in openDocs) {
        // Switch to open document
        switchSession(filepath);
      } else {
        // Load document from filesystem
        $log.debug('Load '+filepath+' from filesystem.');
        var fileContents = FilesystemService.getFileContents(filepath);
        fileContents.then(
          function(contents) {
            var mode = AceModeService.getModeForPath(filepath);
            $rootScope.$emit('aceModeChanged', mode);
            createNewSession(filepath,contents,mode.mode);
            switchSession(filepath);
          }
        );
      }
    }
};

  return {
    /**
     * Called when ace editor has loaded. Must be bound to directive by controller.
     */
    onAceLoad: function(_ace) {
      var um,content,mode,activeSession,sel,unsaved;
      editor = _ace;
      if (Object.keys(openDocs).length !== 0) {
        for (var filepath in openDocs) {
          if (openDocs.hasOwnProperty(filepath)) {
            if (openDocs[filepath].active) {
              activeSession = filepath;
            }
            // Preserve select portions of the old EditSession, and then
            // reapply them to a new EditSession created against the editor.
            um = openDocs[filepath].session.getUndoManager();
            content = openDocs[filepath].session.getDocument();
            mode = openDocs[filepath].session.$modeId;
            sel = openDocs[filepath].session.selection;
            unsaved = openDocs[filepath].unsaved;
            createNewSession(filepath,content,mode,um);
            openDocs[filepath].session.selection = sel;
            openDocs[filepath].unsaved = unsaved;
          }
        }
        switchSession(activeSession);
      } else {
        createUntitledDocument();
      }
      applySettings();
    },
    /**
     * return an object of open documents in the editor.
     * {
     *   '<filepath>': {
     *     filename: str,
     *     unsaved: boolean,
     *     active: boolean,
     *     session: obj (defined by Ace)
     *   },
     *   ...
     * }
     */
    getOpenDocs: function() {
      return openDocs;
    },
    /**
     * The following methods get/set editor settings. The editor settings object
     * is in the following format, with defaults indicated:
     * {
     *   showInvisibles: true,
     *   useSoftTabs: true,
     *   fontSize: 12,
     *   tabSize: 4,
     *   showIndentGuides: true
     * }
     */
    getSettings: function() {
      return editorSettings;
    },
    setSettings: function(settings) {
      editorSettings = settings;
      applySettings();
    },
    /**
     * @ngdoc
     * @name sandstone.EditorService#openDocument
     * @methodOf sandstone.EditorService
     *
     * @description
     * Method to open a document in the editor.
     * @example
     * EditorService.openDocument('/path/to/file');
     * @param {str} [filepath] If called with a filepath, that document will be opened or switched to,
     * otherwise a new document will be created and switched to.
     * @returns {str} returns filepath of opened document, or return undefined if opening fails.
     */
    openDocument: openDocument,
    /**
     * @ngdoc
     * @name sandstone.EditorService#closeDocument
     * @methodOf sandstone.EditorService
     *
     * @description
     * Method to close an open document in the editor.
     * @example
     * EditorService.closeDocument('/path/to/file');
     * @param {str} filepath Closes the open document identified by filepath.
     * @returns {str} returns filepath of closed document, or return undefined in case of failure.
     */
    closeDocument: function(filepath) {
      if (filepath in openDocs) {
        delete openDocs[filepath];

        if (Object.keys(openDocs).length !== 0) {
          switchSession(Object.keys(openDocs)[0]);
        }
      }
    },
    /**
     * @ngdoc
     * @name sandstone.EditorService#saveDocument
     * @methodOf sandstone.EditorService
     *
     * @description
     * Method to save an open document in the editor.
     * @example
     * EditorService.saveDocument('/path/to/file');
     * @param {str} filepath Saves the open document identified by filepath to the filesystem.
     * @returns {str} returns filepath of saved document, or return undefined in case of failure.
     */
    saveDocument: function(filepath) {
      var content = openDocs[filepath].session.getValue();
      var updateContents = function() {
        var writeContents = FilesystemService.writeFileContents(filepath,content);
        writeContents.then(
          function() {
            $log.debug('Saved file: ', filepath);
            openDocs[filepath].unsaved = false;
            $rootScope.$emit('refreshFiletree');
            var mode = AceModeService.getModeForPath(filepath);
            $rootScope.$emit('aceModeChanged', mode);
          }
        );
      };
      var createAndUpdate = function(data,status) {
        if (status === 404) {
          var createFile = FilesystemService.createFile(filepath);
          createFile.then(updateContents);
        }
      };
      var fileDetails = FilesystemService.getFileDetails(filepath);
      fileDetails.then(updateContents,createAndUpdate);
    },
    fileRenamed: function(oldpath,newpath) {
      if (oldpath in openDocs) {
        openDocs[newpath] = {
          filepath: newpath,
          filename: FilesystemService.basename(newpath),
          unsaved: openDocs[oldpath].unsaved,
          active: openDocs[oldpath].active,
          session: openDocs[oldpath].session
        };
        var mode = AceModeService.getModeForPath(newpath);
        openDocs[newpath].session.setMode(mode.mode);
        delete openDocs[oldpath];
      }
    },
    fileDeleted: function(filepath) {
      if (filepath in openDocs) {
        openDocs[filepath].unsaved = true;
      }
    },
    applyEditorSettings: function () {
      applySettings();
    },
    openSearchBox: function () {
      editor.execCommand("replace");
    },
    undoChanges: function (filepath) {
      if (filepath in openDocs) {
        var um = openDocs[filepath].session.getUndoManager();
        um.undo();
        openDocs[filepath].session.setUndoManager(um);
      }
    },
    redoChanges: function (filepath) {
      if (filepath in openDocs) {
        var um = openDocs[filepath].session.getUndoManager();
        um.redo();
        openDocs[filepath].session.setUndoManager(um);
      }
    },
    copySelection: function () {
      clipboard = editor.getCopyText();
    },
    cutSelection: function () {
      clipboard = editor.getCopyText();
      editor.insert('');
    },
    pasteClipboard: function () {
      editor.insert(clipboard);
    },
    commentSelection: function () {
      editor.toggleCommentLines();
    },
    getCurrentDoc: getCurrentDoc,
    setAceMode: function(mode) {
      var path = getCurrentDoc();
      openDocs[path].session.setMode(mode.mode);
    }
  };
}]);
