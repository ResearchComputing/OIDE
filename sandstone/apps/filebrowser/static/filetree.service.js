'use strict';

angular.module('sandstone.filebrowser')

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

  var populateTreeData = function(data, status, headers, config){
    for (var i=0;i<data.length;i++) {
      data[i].children = [];
    }
    treeData.filetreeContents = data;
  };

  var initializeFiletree = function () {
    FilesystemService.getFolders({filepath: ''}, populateTreeData);
  };
  initializeFiletree();
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
  var getFilepathsForDir = function (dirpath) {
    var children = getNodeFromPath(dirpath,treeData.filetreeContents).children;
    var filepaths = [];
    for (var i=0;i<children.length;i++) {
      filepaths.push(children[i].filepath);
    }
    return filepaths;
  };
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
  var isExpanded = function (filepath) {
    for (var i=0;i<treeData.expandedNodes.length;i++) {
      if (treeData.expandedNodes[i].filepath === filepath) {
        return true;
      }
    }
    return false;
  };
  var isDisplayed = function (filepath) {
    for (var i=0;i<treeData.filetreeContents.length;i++) {
      if (treeData.filetreeContents[i].filepath === filepath) {
        return true;
      }
    }
    return false;
  };

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

  // Callback for getting directory contents
  // For filebrowser, only the folders are returned in this call
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
  var getDirContents = function (node) {
    currentlyExpandingNode = node;
    FilesystemService.getFolders(node, populatetreeContents);
  };
  var updateFiletree = function () {
    var filepath, node;
    for (var i=0;i<treeData.expandedNodes.length;i++) {
      getDirContents(treeData.expandedNodes[i]);
    }
  };
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

  // Callback of invocation to FilesystemService to create a file
  // Update the filetree to show the new file
  var createFileCallback = function(data, status, headers, config){
    $log.debug('POST: ', data);
    updateFiletree();
  };

  // Callback of invocation to FilesystemService to get the next Untitled FIle
  // Invoke the FilesystemService to create the new file
  var gotNewUntitledFile = function(data, status, headers, config) {
    $log.debug('GET: ', data);
    var newFilePath = data.result;
    // Post back new file to backend
    FilesystemService.createNewFile(newFilePath, createFileCallback);
  };

  // Callback for invocation to FilesystemService rename method
  var fileRenamed = function(data, status, headers, config, node) {
    $rootScope.$emit('fileRenamed', node.filepath, data.result);
    removeNodeFromFiletree(node);
    updateFiletree();
    $log.debug('POST: ', data.result);
  };

  // Callback for invocation to FilesystemService paste method
  var pastedFiles = function(data, status, headers, config, node){
    $log.debug('POST: ', data.result);
  };

  // Callback for invocation to FilesystemService deleteFile method
  var deletedFile = function(data, status, headers, config, node) {
    $log.debug('DELETE: ', data.result);
    var node = getNodeFromPath(data.filepath,treeData.filetreeContents);
    removeNodeFromFiletree(node);
    $rootScope.$emit('fileDeleted', data.filepath);
    updateFiletree();
  };

  // Callback for getting the next duplicated file for selected file
  var gotNextDuplicateFile = function(data, status, headers, config) {
    $log.debug('GET: ', data);
     var newFilePath = data.result;
     FilesystemService.duplicateFile(data.originalFile, newFilePath, duplicatedFile);
  };

  // Callback for duplicating a file
  var duplicatedFile = function(data, status, headers, config) {
    $log.debug('Copied: ', data.result);
    updateFiletree();
  };

  // Callback for getting a new untitled directory name from FilesystemService
  var gotNewUntitledDir = function(data, status, headers, config) {
    $log.debug('GET: ', data);
    var newDirPath = data.result;
    FilesystemService.createNewDir(newDirPath, createdNewDir);
  };

  // Callback for creating new directory
  var createdNewDir = function(data, status, headers, config) {
    $log.debug('POST: ', data);
    updateFiletree();
  }

  return {
    treeData: treeData,
    selectionDesc: selectionDesc,
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
    openFilesInEditor: function () {
      return treeData.selectedNodes;
    },
    createNewFile: function () {
      //Invokes filesystem service to create a new file
      var selectedDir = treeData.selectedNodes[0].filepath;
      FilesystemService.getNextUntitledFile(selectedDir, gotNewUntitledFile);
    },
    // Invoke FilesystemService to create a new directory
    createNewDir: function () {
      var selectedDir = treeData.selectedNodes[0].filepath;
      FilesystemService.getNextUntitledDir(selectedDir, gotNewUntitledDir);
    },
    // Create a duplicate of the selected file
    createDuplicate: function () {
      var selectedFile = treeData.selectedNodes[0].filepath;
      FilesystemService.getNextDuplicate(selectedFile, gotNextDuplicateFile);
    },
    // Delete selected files by invoking the FilesystemService deleteFile method
    deleteFiles: function () {
      for (var i=0;i<treeData.selectedNodes.length;i++) {
        var node = treeData.selectedNodes[i];
        FilesystemService.deleteFile(node, deletedFile);
      }
    },
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
    // Invoke the Filesystem Service to paste a file from the clipboard
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
    // Invoke the Filesystem Service to rename a file
    renameFile: function(newFilename, node, callback) {
      FilesystemService.renameFile(newFilename, node, callback);
    }
  };
}]);
