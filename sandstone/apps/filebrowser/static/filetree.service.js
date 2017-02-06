'use strict';
/**
 * Filebrowser
 * @namespace Filebrowser
 */
angular.module('sandstone.filebrowser')
/**
 * @namespace FBFiletreeService
 * @desc Service to manage the Filetree for the Filebrowser app
 * @memberOf Filebrowser
 */
.factory('FBFiletreeService', ['$http', '$document', '$q', '$log', '$rootScope', 'FilesystemService', function($http,$document,$q,$log, $rootScope, FilesystemService) {
  var treeData, selectionDesc;
  treeData = {
    filetreeContents: [
      // { "type": "dir", "filepath": "/tmp/", "filename" : "tmp", "children" : []}
    ]
  };
  selectionDesc = {
    noSelections: true,
    multipleSelections: false,
    dirSelected: false
  };
  var clipboard = [];

/**
 * @name populateTreeData
 * @desc Populate the Filetree with Data.
 * @param {Object} data The object containing the Filetree data
 * @param {Object} status The object containing the HTTP status
 * @param {Object} headers The object containing the HTTP headers
 * @param {Object} config The object containing the HTTP config data
 * @memberOf FileBrowser.FBFiletreeService
 */
  var populateTreeData = function(data, status, headers, config){
    for (var i=0;i<data.length;i++) {
      data[i].children = [];
    }
    treeData.filetreeContents = data;
  };
/**
 * @name initializeFiletree
 * @desc Initialize the Filetree. Get initial contents
 * @memberOf FileBrowser.FBFiletreeService
 */
  var initializeFiletree = function () {
    FilesystemService.getFolders({filepath: ''}, populateTreeData);
  };
  initializeFiletree();

/**
 * @name getNodeFromPath
 * @desc Given a filepath, and list of nodes, return the Node representing the Filepath
 * @param {String} filepath The filepath for which the Node is needed
 * @param {Object[]} nodeList The list of nodes in the Filesystem
 * @memberOf FileBrowser.FBFiletreeService
 */
  var getNodeFromPath = function (filepath, nodeList) {
    var matchedNode;
    var folderName;
    var strippedFilepath;
    for (var i=0;i<nodeList.length;i++) {
      folderName = nodeList[i].filepath;
      strippedFilepath = filepath;
      if(filepath.charAt(filepath.length - 1) == '/') {
        strippedFilepath = filepath.substr(0, filepath.length - 1);
      }
      if(nodeList[i].type == 'dir' && folderName.charAt(folderName.length - 1) == '/') {
        folderName = folderName.substr(0, folderName.length - 1);
      }
      if (strippedFilepath.lastIndexOf(folderName,0) === 0) {
        if (strippedFilepath === folderName) {
          return nodeList[i];
        } else if (nodeList[i].type === 'dir') {
          if(nodeList[i].children.length == 0) {
            continue;
          }
          return getNodeFromPath(filepath, nodeList[i].children);
        }
      }
    }
  };

/**
 * @name getFilepathsForDir
 * @desc Given a dirpath, get all the file paths in the directory
 * @param {String} filepath The filepath for which the Node is needed
 * @returns {String[]} filepaths An array containing the filepaths in the specified directory
 * @memberOf FileBrowser.FBFiletreeService
 */
  var getFilepathsForDir = function (dirpath) {
    var children = getNodeFromPath(dirpath,treeData.filetreeContents).children;
    var filepaths = [];
    for (var i=0;i<children.length;i++) {
      filepaths.push(children[i].filepath);
    }
    return filepaths;
  };

/**
 * @name removeNodeFromFiletree
 * @desc Given a node, remove it from the Filetree
 * @param {Object} node The node which needs to be removed from the filetree
 * @memberOf FileBrowser.FBFiletreeService
 */
  var removeNodeFromFiletree = function (node){
    var index;
    index = treeData.selectedNodes.indexOf(node);
    if (index >= 0) {
      treeData.selectedNodes.splice(index, 1);
    }
    index = treeData.expandedNodes.indexOf(node);
    if (index >= 0) {
      treeData.expandedNodes.splice(index, 1);
    }
    var filepath, dirpath, parentNode;
    if (node.filepath.slice(-1) === '/') {
      filepath = node.filepath.substring(0,node.filepath.length-1);
    } else {
      filepath = node.filepath;
    }
    dirpath = filepath.substring(0,filepath.lastIndexOf('/')+1);
    parentNode = getNodeFromPath(dirpath,treeData.filetreeContents);
    index = parentNode.children.indexOf(node);
    parentNode.children.splice(index,1);
    describeSelection();
  };

/**
 * @name isExpanded
 * @desc Given a filepath, return if the corresponding Node is expanded or not
 * @param {String} filepath Filepath of the directory
 * @returns {Boolean} true if filepath is expanded. Else false
 * @memberOf FileBrowser.FBFiletreeService
 */
  var isExpanded = function (filepath) {
    for (var i=0;i<treeData.expandedNodes.length;i++) {
      if (treeData.expandedNodes[i].filepath === filepath) {
        return true;
      }
    }
    return false;
  };

/**
 * @name isDisplayed
 * @desc Given a filepath, return if the corresponding Node is displayed or not
 * @param {String} filepath Filepath
 * @returns {Boolean} true if filepath is displayed. Else false
 * @memberOf FileBrowser.FBFiletreeService
 */
  var isDisplayed = function (filepath) {
    for (var i=0;i<treeData.filetreeContents.length;i++) {
      if (treeData.filetreeContents[i].filepath === filepath) {
        return true;
      }
    }
    return false;
  };

/**
 * @name getNodePath
 * @desc Given a filepath, list of nodes, and node, get the path for the node
 * @param {String} filepath Filepath
 * @param {Object[]} nodeList The list of nodes in the filesystem
 * @param {Object} node The node whose path is being determined
 * @returns {String} filepath The filepath of the node
 * @returns {Boolean} true if filepath is displayed. Else false
 * @memberOf FileBrowser.FBFiletreeService
 */
  var getNodePath = function(filepath, nodeList, node) {
    var matchedNode;
    var folderName;
    var strippedFilepath;
    var nodes = node.children;
    for (var i=0;i<nodes.length;i++) {
      folderName = nodes[i].filepath;
      strippedFilepath = filepath;
      if(filepath.charAt(filepath.length - 1) == '/') {
        strippedFilepath = filepath.substr(0, filepath.length - 1);
      }
      if(nodeList[i] && nodeList[i].type == 'dir' && folderName.charAt(folderName.length - 1) == '/') {
        folderName = folderName.substr(0, folderName.length - 1);
      }
      if (strippedFilepath.lastIndexOf(folderName,0) === 0) {
        if (strippedFilepath === folderName) {
          return nodes[i];
        } else if (nodes[i].type === 'dir') {
          if(nodes[i].children.length == 0) {
            continue;
          }
          return getNodePath(filepath, nodes, nodes[i].children);
        }
      }
    }
  }


/**
 * @name populatetreeContents
 * @desc Given data, populate the tree. Callback for getting directory contents. For filebrowser, only the folders are returned in this call
 * @param {Object[]} data Represents the tree data
 * @param {Object} status The object containing the HTTP status
 * @param {Object} headers The object containing the HTTP headers
 * @param {Object} config The object containing the HTTP config data
 * @memberOf FileBrowser.FBFiletreeService
 */
  var populatetreeContents = function(data, status, headers, config, node) {
    var matchedNode;
    var currContents = getFilepathsForDir(node.filepath);
    for (var i=0;i<data.length;i++) {
      if (currContents.indexOf(data[i].filepath) >= 0) {
        matchedNode = getNodePath(data[i].filepath,treeData.filetreeContents, node);
        if ((data[i].type === 'dir')&&isExpanded(data[i].filepath)) {
          getDirContents(matchedNode);
        }
        currContents.splice(currContents.indexOf(data[i].filepath), 1);
      } else {
        data[i].children = [];
        node.children.push(data[i]);
      }
    }
    var index;
    for (var i=0;i<currContents.length;i++) {
      matchedNode = getNodeFromPath(currContents[i],treeData.filetreeContents);
      removeNodeFromFiletree(matchedNode);
    }
  };

  // Invoke Filesystem service to get the folders in the selected directory
  // Invoked when a node is expanded
  var currentlyExpandingNode;

/**
 * @name getDirContents
 * @desc Get directory contents for the node
 * @param {Object} node Represents the node whose contents are being retrieved
 * @memberOf FileBrowser.FBFiletreeService
 */
  var getDirContents = function (node) {
    currentlyExpandingNode = node;
    FilesystemService.getFolders(node, populatetreeContents);
  };

/**
 * @name updateFiletree
 * @desc Refreshes the Filetree by getting contents for each expanded node
 * @memberOf FileBrowser.FBFiletreeService
 */
  var updateFiletree = function () {
    var filepath, node;
    for (var i=0;i<treeData.expandedNodes.length;i++) {
      getDirContents(treeData.expandedNodes[i]);
    }
  };

/**
 * @name describeSelection
 * @desc add the selected folders to dirSelected
 * @memberOf FileBrowser.FBFiletreeService
 */
  var describeSelection = function () {
    selectionDesc.multipleSelections = treeData.selectedNodes.length > 1;
    selectionDesc.noSelections = treeData.selectedNodes.length === 0;
    var dirSelected = false;
    for (var i in treeData.selectedNodes) {
      if (treeData.selectedNodes[i].type==='dir') {
        dirSelected = true;
      }
    }
    selectionDesc.dirSelected = dirSelected;
  };

/**
 * @name createFileCallback
 * @desc Callback of invocation to FilesystemService to create a file. Update the filetree to show the new file
 * @param {Object[]} data Represents the result of creating a file
 * @param {Object} status The object containing the HTTP status
 * @param {Object} headers The object containing the HTTP headers
 * @param {Object} config The object containing the HTTP config data
 * @memberOf FileBrowser.FBFiletreeService
 */
  var createFileCallback = function(data, status, headers, config){
    $log.debug('POST: ', data);
    updateFiletree();
  };


  /**
   * @name gotNewUntitledFile
   * @desc Callback of invocation to FilesystemService to get the next Untitled File. Invoke the FilesystemService to create the new file
   * @param {Object[]} data Represents the result of getting filename of new file
   * @param {Object} status The object containing the HTTP status
   * @param {Object} headers The object containing the HTTP headers
   * @param {Object} config The object containing the HTTP config data
   * @memberOf FileBrowser.FBFiletreeService
   */
  var gotNewUntitledFile = function(data, status, headers, config) {
    $log.debug('GET: ', data);
    var newFilePath = data.result;
    // Post back new file to backend
    FilesystemService.createNewFile(newFilePath, createFileCallback);
  };

  /**
   * @name fileRenamed
   * @desc Callback for invocation to FilesystemService rename method
   * @param {Object[]} data Represents the result of renaming a file
   * @param {Object} status The object containing the HTTP status
   * @param {Object} headers The object containing the HTTP headers
   * @param {Object} config The object containing the HTTP config data
   * @memberOf FileBrowser.FBFiletreeService
   */
  var fileRenamed = function(data, status, headers, config, node) {
    $rootScope.$emit('fileRenamed', node.filepath, data.result);
    removeNodeFromFiletree(node);
    updateFiletree();
    $log.debug('POST: ', data.result);
  };

  /**
   * @name pastedFiles
   * @desc Callback for invocation to FilesystemService paste method
   * @param {Object[]} data Represents the result of pasting a file
   * @param {Object} status The object containing the HTTP status
   * @param {Object} headers The object containing the HTTP headers
   * @param {Object} config The object containing the HTTP config data
   * @memberOf FileBrowser.FBFiletreeService
   */
  var pastedFiles = function(data, status, headers, config, node){
    $log.debug('POST: ', data.result);
  };

  /**
   * @name deletedFile
   * @desc Callback for invocation to FilesystemService deleteFile method
   * @param {Object[]} data Represents the result of deleting a file
   * @param {Object} status The object containing the HTTP status
   * @param {Object} headers The object containing the HTTP headers
   * @param {Object} config The object containing the HTTP config data
   * @memberOf FileBrowser.FBFiletreeService
   */
  var deletedFile = function(data, status, headers, config, node) {
    $log.debug('DELETE: ', data.result);
    var node = getNodeFromPath(data.filepath,treeData.filetreeContents);
    removeNodeFromFiletree(node);
    $rootScope.$emit('fileDeleted', data.filepath);
    updateFiletree();
  };

  /**
   * @name gotNextDuplicateFile
   * @desc Callback for getting the next duplicated file for selected file
   * @param {Object[]} data Represents the result of geting the filename of next dupicate file
   * @param {Object} status The object containing the HTTP status
   * @param {Object} headers The object containing the HTTP headers
   * @param {Object} config The object containing the HTTP config data
   * @memberOf FileBrowser.FBFiletreeService
   */
  var gotNextDuplicateFile = function(data, status, headers, config) {
    $log.debug('GET: ', data);
     var newFilePath = data.result;
     FilesystemService.duplicateFile(data.originalFile, newFilePath, duplicatedFile);
  };

  /**
   * @name duplicatedFile
   * @desc Callback for duplicating a file
   * @param {Object[]} data Represents the result of duplicating a file
   * @param {Object} status The object containing the HTTP status
   * @param {Object} headers The object containing the HTTP headers
   * @param {Object} config The object containing the HTTP config data
   * @memberOf FileBrowser.FBFiletreeService
   */
  var duplicatedFile = function(data, status, headers, config) {
    $log.debug('Copied: ', data.result);
    updateFiletree();
  };

  /**
   * @name gotNewUntitledDir
   * @desc Callback for getting a new untitled directory name from FilesystemService
   * @param {Object[]} data Represents the result of getting the name of the next untitled directory
   * @param {Object} status The object containing the HTTP status
   * @param {Object} headers The object containing the HTTP headers
   * @param {Object} config The object containing the HTTP config data
   * @memberOf FileBrowser.FBFiletreeService
   */
  var gotNewUntitledDir = function(data, status, headers, config) {
    $log.debug('GET: ', data);
    var newDirPath = data.result;
    FilesystemService.createNewDir(newDirPath, createdNewDir);
  };

  /**
   * @name createdNewDir
   * @desc Callback for creating new directory
   * @param {Object[]} data Represents the result of getting the name of the next untitled directory
   * @param {Object} status The object containing the HTTP status
   * @param {Object} headers The object containing the HTTP headers
   * @param {Object} config The object containing the HTTP config data
   * @memberOf FileBrowser.FBFiletreeService
   */
  var createdNewDir = function(data, status, headers, config) {
    $log.debug('POST: ', data);
    updateFiletree();
  }

  return {
    treeData: treeData,
    selectionDesc: selectionDesc,
    /**
     * @name clipboardEmpty
     * @desc Returns whether clipboard is empty or not
     * @returns {Boolean} true if the clipboard is empty, else false
     * @memberOf FileBrowser.FBFiletreeService
     */
    clipboardEmpty: function () {
      return clipboard.length === 0;
    },
    describeSelection: function (node, selected) {
      describeSelection();
    },
    getDirContents: function (node) {
      getDirContents(node);
      // updateFiletree();
    },
    updateFiletree: function () {
      updateFiletree();
    },
    /**
     * @name openFilesInEditor
     * @desc Returns the opened files in the editor
     * @returns {Object} treeData.selectedNodes The list of open files
     * @memberOf FileBrowser.FBFiletreeService
     */
    openFilesInEditor: function () {
      return treeData.selectedNodes;
    },
    /**
     * @name createNewFile
     * @desc Create a new file
     */
    createNewFile: function () {
      //Invokes filesystem service to create a new file
      var selectedDir = treeData.selectedNodes[0].filepath;
      FilesystemService.getNextUntitledFile(selectedDir, gotNewUntitledFile);
    },
    /**
     * @name createNewDir
     * @desc Invoke FilesystemService to create a new directory
     */
    createNewDir: function () {
      var selectedDir = treeData.selectedNodes[0].filepath;
      FilesystemService.getNextUntitledDir(selectedDir, gotNewUntitledDir);
    },
    /**
     * @name createDuplicate
     * @desc Create a duplicate of the selected file
     */
    createDuplicate: function () {
      var selectedFile = treeData.selectedNodes[0].filepath;
      FilesystemService.getNextDuplicate(selectedFile, gotNextDuplicateFile);
    },
    /**
     * @name deleteFiles
     * @desc Delete selected files by invoking the FilesystemService deleteFile method
     */
    deleteFiles: function () {
      for (var i=0;i<treeData.selectedNodes.length;i++) {
        var filepath = treeData.selectedNodes[i].filepath;
        FilesystemService.deleteFile(filepath, deletedFile);
      }
    },
    /**
     * @name copyFiles
     * @desc Copy selected files to the clipboard
     */
    copyFiles: function () {
      clipboard = [];
      var node, i;
      for (i=0;i<treeData.selectedNodes.length;i++) {
        node = treeData.selectedNodes[i]
        clipboard.push({
          'filename': node.filename,
          'filepath': node.filepath
        });
      }
      $log.debug('Copied ', i, ' files to clipboard: ', clipboard)
    },
    /**
     * @name pasteFiles
     * @desc Invoke the Filesystem Service to paste a file from the clipboard
     */
    pasteFiles: function () {
      var i;
      var newDirPath = treeData.selectedNodes[0].filepath;
      for (i=0;i<clipboard.length;i++) {
        FilesystemService.pasteFile(clipboard[i].filepath, newDirPath + clipboard[i].filename, pastedFiles);
      }
      clipboard = [];
      if (!isExpanded(newDirPath)) {
        var node = getNodeFromPath(newDirPath,treeData.filetreeContents);
        treeData.expandedNodes.push(node);
      }
      updateFiletree();
    },
    /**
     * @name renameFile
     * @desc Invoke the Filesystem Service to rename a file
     */
    renameFile: function(newFilename, node, callback) {
      FilesystemService.renameFile(newFilename, node, callback);
    }
  };
}]);
