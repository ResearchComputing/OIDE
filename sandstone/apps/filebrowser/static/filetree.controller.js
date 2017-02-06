'use strict';
/**
 * Filebrowser
 * @namespace FiletreeController
 * @memberOf Filebrowser
 */
angular.module('sandstone.filebrowser')
.controller('FiletreeController', ['$document', '$log', 'FBFiletreeService', 'FilesystemService', 'FileService', '$scope', function($document,$log,FiletreeService, FilesystemService, FileService, $scope) {
  var self = this;
  self.treeData= FiletreeService.treeData;
  self.multiSelection = false;
  $scope.$watch(function(){
      return FileService.getSelectionPath();
    }, function (newValue) {
      if(newValue == "") {
        return;
      }
      self.describeSelection({'filepath': newValue, 'type': 'dir'}, true);
  });

  $document.on('keydown', (function (e) {
    if (e.keyCode === 17) {
      self.multiSelection = true;
    }
  }));
  $document.on('keyup', (function (e) {
    if (e.keyCode === 17) {
      self.multiSelection = false;
    }
  }));
  self.treeOptions = {
    multiSelection: true,
    isLeaf: function(node) {
      return node.type !== 'dir';
    },
    injectClasses: {
      iExpanded: "filetree-icon fa fa-folder-open",
      iCollapsed: "filetree-icon fa fa-folder",
      iLeaf: "filetree-icon fa fa-file",
    }
  };

  /**
   * @name self.gotFiles
   * @desc Callback for getting files from the FilesystemService
   * @param {Object[]} data Represents the result of getting the files from the Filesystem
   * @param {Object} status The object containing the HTTP status
   * @param {Object} headers The object containing the HTTP headers
   * @param {Object} config The object containing the HTTP config data
   * @memberOf FileBrowser.FiletreeController
   */
  self.gotFiles = function(data, status, headers, config) {
    FileService.setFileData(data);
  };

  /**
   * @name self.gotRootDirectory
   * @desc Callback for getting the root directory
   * @param {Object[]} data Represents the result of getting the root directory from the Filesystem
   * @param {Object} status The object containing the HTTP status
   * @param {Object} headers The object containing the HTTP headers
   * @param {Object} config The object containing the HTTP config data
   * @memberOf FileBrowser.FiletreeController
   */
  self.gotRootDirectory = function(data, status, headers, config) {
    var rootDirectory = data.result;
    FileService.setRootDirectory(rootDirectory);
  };

  /**
   * @name self.gotVolumeInfo
   * @desc Callback for getting the volume information
   * @param {Object[]} data Represents the result of getting the volume information from the Filesystem
   * @param {Object} status The object containing the HTTP status
   * @param {Object} headers The object containing the HTTP headers
   * @param {Object} config The object containing the HTTP config data
   * @memberOf FileBrowser.FiletreeController
   */
  self.gotVolumeInfo = function(data, status, headers, config) {
    var volumeInfo = data.result;
    FileService.setVolumeInfo(volumeInfo);
  };

  /**
   * @name self.describeSelection
   * @desc Depending on the selection, gets root directory, volume information from the filesystem
   * @param {Object} node Represents the selected node
   * @param {Boolean} selected true if node is selected, else false
   * @memberOf FileBrowser.FiletreeController
   */
  self.describeSelection = function (node, selected) {
    if (self.multiSelection === false) {
      if (selected) {
        self.treeData.selectedNodes = [node];
        // Set the current directory
        FileService.setCurrentDirectory(node.filepath);
        // Get the list of files from FilesystemService
        FilesystemService.getFiles(node, self.gotFiles);
        // Get Root Directory
        FilesystemService.getRootDirectory(node.filepath, self.gotRootDirectory);
        FilesystemService.getVolumeInfo(node.filepath, self.gotVolumeInfo);
      } else {
        self.treeData.selectedNodes = [];
      }
    }
    FiletreeService.describeSelection(node, selected);
  };

  /**
   * @name self.describeSelection
   * @desc Get the directory contents if the node is expanded
   * @param {Object} node Represents the node
   * @param {Boolean} expanded true if node is expanded, else false
   * @memberOf FileBrowser.FiletreeController
   */
  self.getDirContents = function (node, expanded) {
    if(expanded) {
      FiletreeService.getDirContents(node);
    }
  };
  self.showSelected = function(node, selected) {
    console.log(node);
    console.log(selected);
  };
}]);
