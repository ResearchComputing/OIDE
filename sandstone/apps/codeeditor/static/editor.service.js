'use strict';

/**
 * @ngdoc service
 * @name sandstone.EditorService
 * @description
 * # EditorService
 * Service to manage documents in the Sandstone IDE Editor.
 */
angular.module('sandstone.editor')

.factory('EditorService', ['$window', '$http', '$log', '$q', 'AceModeService', 'FilesystemService', 'AlertService', '$rootScope', function ($window, $http,$log,$q,AceModeService,FilesystemService,AlertService,$rootScope) {
  var editor = {};

  // modifiedFiles will hold modified filepaths that are opened in the editor.
  // If a filepath is in suppressed, it will prevent the next event containing
  // that path from being added to the queue.
  var modifiedFiles = {
    suppressed: [],
    queue: []
  };

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

  var treeData = {
    contents: [],
    selected: [],
    expanded: []
  };
  var treeOptions = {
    multiSelection: false
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
      var documentOpened = openDocument(data.filepath);
      documentOpened.then(function(filepath) {
        switchSession(filepath);
      });
  });

  $rootScope.$on('filesystem:file_modified', function(event, data) {
      if (data.filepath in openDocs) {
        var suppressedIndex = modifiedFiles.suppressed.indexOf(data.filepath);
        if (suppressedIndex >= 0) {
          modifiedFiles.suppressed.splice(suppressedIndex,1);
        } else {
          console.log('Open file ' + data.filepath + ' modified on disk.');
          modifiedFiles.queue.push(data.filepath);
        }
      }
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
    return filepath;
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
      return true;
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
    var deferred = $q.defer();
    if (typeof filepath === 'undefined') {
      // Create an untitled document, and a new editSession to associate it with.
      var newFilepath = createUntitledDocument();
      deferred.resolve(newFilepath)
    } else {
      if (filepath in openDocs) {
        // Switch to open document
        deferred.resolve(filepath)
      } else {
        // Load document from filesystem
        $log.debug('Load '+filepath+' from filesystem.');
        var fileContents = FilesystemService.getFileContents(filepath);
        fileContents.then(
          function(contents) {
            // Add file directory to watchers to get notifications of file modification.
            var dirpath = FilesystemService.dirname(filepath);
            FilesystemService.createFilewatcher(dirpath);

            var mode = AceModeService.getModeForPath(filepath);
            $rootScope.$emit('aceModeChanged', mode);
            createNewSession(filepath,contents,mode.mode);
            deferred.resolve(filepath);
          },
          function(res) {
            if (res.status === 404) {
              AlertService.addAlert({
                type: 'warning',
                message: 'File does not exist: ' + filepath
              });
            } else {
              AlertService.addAlert({
                type: 'warning',
                message: 'Failed to load file ' + filepath
              });
            }
            deferred.reject(res);
          }
        );
      }
    }
    return deferred.promise;
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
        var newFilepath = createUntitledDocument();
        switchSession(newFilepath);
      }
      applySettings();
    },
    /*
     * The modified queue is used to store filepaths of modified files that are
     * currently opened in the editor. The TabsCtrl is responsible for alerting
     * the user and handling state reconciliation.
     */
    getModifiedFiles: function() {
      return modifiedFiles.queue;
    },
    removeFromModifiedFile: function(filepath) {
      var index = modifiedFiles.queue.indexOf(filepath);
      var suppressedIndex = modifiedFiles.suppressed.indexOf(filepath);
      if (index >=0) {
        modifiedFiles.queue.splice(index,1);
      }
      if (suppressedIndex >=0) {
        modifiedFiles.suppressed.splice(suppressedIndex,1);
      }
    },
    treeData: treeData,
    treeOptions: treeOptions,
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
     * @ngdoc
     * @name sandstone.EditorService#setSession
     * @methodOf sandstone.EditorService
     *
     * @description
     * Method to set the editor session
     * @example
     * EditorService.setSession('/path/to/file');
     * @param {str} [filepath] The filepath corresponding to the desired session.
     * @returns {bool} If the filepath matched an existing session, returns true if session successfully switched. Otherwise, return false.
     */
    setSession: function(filepath) {
      var switched = switchSession(filepath);
      return switched;
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

        // Remove filewatcher if the filepath is valid
        if (FilesystemService.isAbsolute(filepath)) {
          var dirname = FilesystemService.dirname(filepath);
          FilesystemService.deleteFilewatcher(dirname);
        }

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
      var deferred = $q.defer();
      var content = openDocs[filepath].session.getValue() || '';
      var updateContents = function() {
        if (!content) {
          deferred.resolve();
        } else {
          modifiedFiles.suppressed.push(filepath);
          var writeContents = FilesystemService.writeFileContents(filepath,content);
          writeContents.then(
            function() {
              $log.debug('Saved file: ', filepath);
              openDocs[filepath].unsaved = false;
              var mode = AceModeService.getModeForPath(filepath);
              $rootScope.$emit('aceModeChanged', mode);
              deferred.resolve(filepath);
            },
            function(res) {
              // Unsuppress filepath since write failed
              var suppressedIndex = modifiedFiles.suppressed.indexOf(filepath);
              if (suppressedIndex >= 0) {
                modifiedFiles.suppressed.splice(suppressedIndex,1);
              }

              AlertService.addAlert({
                type: 'warning',
                message: 'Failed to save file ' + filepath
              });
              deferred.reject(res);
            }
          );
        }
      };
      var createAndUpdate = function(data) {
        if (data.status === 404) {
          var createFile = FilesystemService.createFile(filepath);
          createFile.then(
            function() {
              // Add to watchlist now that file is saved and updated
              var dirname = FilesystemService.dirname(filepath);
              FilesystemService.createFilewatcher(dirname);

              updateContents();
            },
            function(res) {
              AlertService.addAlert({
                type: 'warning',
                message: 'Failed to save file as ' + filepath
              });
              deferred.reject(res);
            }
          );
        }
      };
      var fileDetails = FilesystemService.getFileDetails(filepath);
      fileDetails.then(updateContents,createAndUpdate);
      return deferred.promise;
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
