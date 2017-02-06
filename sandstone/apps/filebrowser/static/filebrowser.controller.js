'use strict';

/**
 * Filebrowser
 * @namespace FilebrowserController
 * @memberOf Filebrowser
 */
angular.module('sandstone.filebrowser')
.controller('FilebrowserController', ['$rootScope', 'FileService', '$scope', 'FilesystemService', '$modal', 'BroadcastService', function($rootScope, FileService, $scope, FilesystemService, $modal, BroadcastService){
  var self = this;

  self.treeData = {
    filetreeContents: [],
    selectedNodes: []
  };

  self.sd = {
    noSelections: true,
    multipleSelections: false,
    dirSelected: false
  };

  $scope.$watch(function(){
      return FileService.getFileData();
    }, function (newValue) {
    self.fileData = newValue;
    self.displayData = [].concat(self.fileData);
  });

  $scope.$watch(function(){
    return self.treeData.selectedNodes;
  }, function(node){
    if(!self.multiSelection) {
      if(!self.treeData.selectedNodes.length == 0) {
        // Set the current directory
        FileService.setCurrentDirectory(node[0].filepath);
        // Get the list of files from FilesystemService
        FilesystemService.getFiles(node[0], self.gotFiles);
        // Get Root Directory
        FilesystemService.getRootDirectory(node[0].filepath, self.gotRootDirectory);
        FilesystemService.getVolumeInfo(node[0].filepath, self.gotVolumeInfo);
      }
    }
  });

  $scope.$watch(function(){
      return FileService.getCurrentDirectory();
    }, function (newValue) {
    self.currentDirectory = newValue;
    self.show_details = false;
    var scrollableDiv = document.querySelector('.scrollable-table')
    if(scrollableDiv) {
      scrollableDiv.scrollTop = 0;
    }
  });

  $scope.$watch(function(){
      return FileService.getRootDirectory();
    }, function (newValue) {
    self.rootDirectory = newValue;
  });

  $scope.$watch(function(){
      return FileService.getVolumeInfo();
    }, function (newValue) {
      if(typeof newValue != 'undefined') {
        self.volumeInfo = newValue.percent;
        self.volumeUsed = newValue.used;
        self.volumeSize = newValue.size;
      }
  });

  self.isCopied = false;
  self.isEditing = false;

  /**
   * @name self.copyFile
   * @desc Saves the name of the file to be copied
   * @memberOf sandstone.filebrowser.FilebrowserController
   */
  self.copyFile = function() {
    self.copiedFile = self.selectedFile;
    self.isCopied = true;
  };

  /**
   * @name self.openFileInEditor
   * @desc Opens the Selected File in the Editor
   * @memberOf sandstone.filebrowser.FilebrowserController
   */
  self.openFileInEditor = function() {
      window.location.href = '#/editor';
      var message = {
          key: 'editor:openDocument',
          data: {
              filename: self.selectedFile.filepath
          }
      };
      BroadcastService.sendMessage(message);
  };

  /**
   * @name self.gotFiles
   * @desc Callback function of self.getFiles
   * @memberOf sandstone.filebrowser.FilebrowserController
   */
  self.gotFiles = function(data, status, headers, config) {
    FileService.setFileData(data);
  };

  /**
   * @name self.gotRootDirectory
   * @desc Callback function of self.getRootDirectory
   * @param {Object} data Object containing the Root Directories
   * @memberOf sandstone.filebrowser.FilebrowserController
   */
  self.gotRootDirectory = function(data, status, headers, config) {
    var rootDirectory = data.result;
    FileService.setRootDirectory(rootDirectory);
  };

  /**
   * @name self.gotVolumeInfo
   * @desc Callback function of self.getVolumeInfo
   * @param {Object} data Object containing the volume information
   * @memberOf sandstone.filebrowser.FilebrowserController
   */
  self.gotVolumeInfo = function(data, status, headers, config) {
    var volumeInfo = data.result;
    FileService.setVolumeInfo(volumeInfo);
  };

  /**
   * @name self.formDirPath
   * @desc Converts the components of self.currentDirectory, which is an array into a string path, and returns it
   * @memberOf sandstone.filebrowser.FilebrowserController
   * @returns {String} path - well formed path representing the currently selected directory
   */
  self.formDirPath = function() {
    // Form path
    var path = "";
    var i = 0;
    for(var pathComponent in self.currentDirectory) {
      if(self.currentDirectory[pathComponent] != '/')
        path = path + "/" + self.currentDirectory[pathComponent];
      i++;
    }
    path += "/";
    return path;
  };

  /**
   * @name self.pasteFile
   * @function
   * @memberOf sandstone.filebrowser.FilebrowserController
   * @desc Pastes the copied file into the currently selected directory.
   */
  self.pasteFile = function() {
    // Form path
    var path = self.formDirPath();
    var dirpath = path;

    if(self.copiedFile.type == "dir") {
      path += self.copiedFile.filename;
    }

    FilesystemService.pasteFile(self.copiedFile.filepath, path, function(data){
      console.log(data);
      FilesystemService.getFiles({'filepath': dirpath}, function(data){
        self.fileData = data;
        self.isCopied = false;
        self.copiedFile = "";
      });
    });
  };

  /**
   * @name self.duplicateFile
   * @desc Duplicates the currently selected file
   * @memberOf sandstone.filebrowser.FilebrowserController
   */
  self.duplicateFile = function(){
    FilesystemService.getNextDuplicate(self.selectedFile.filepath, function(data){
      FilesystemService.duplicateFile(data.originalFile, data.result, function(data){
        // Refresh Filetree
        self.refreshDirectory();
      });
    });
  };

  /**
   * @name self.deleteFile
   * @desc Opens the Delete File modal. When the modal is dismissed, the selected files are deleted
   * @memberOf sandstone.filebrowser.FilebrowserController
   */
  self.deleteFile = function() {
    self.modalInstance = $modal.open({
      templateUrl: '/static/filebrowser/templates/delete-modal.html',
      controller: 'DeleteModalInstanceCtrl as ctrl',
      backdrop: 'static',
      resolve: {
        selectedFile: function () {
          return self.selectedFile;
        }
      }
    });

    self.modalInstance.result.then(function(){
      self.selectedFile = "";
      self.show_details = false;
      self.refreshDirectory();
      $rootScope.$emit('refreshFiletree');
      // FiletreeService.updateFiletree();
      self.modalInstance = null;
    });

  };

  /**
   * @name self.openUploadModal
   * @desc Opens the Upload File modal. Allows the user to select upload files from the Filesystem
   * @memberOf sandstone.filebrowser.FilebrowserController
   */
  self.openUploadModal = function() {
    self.modalInstance = $modal.open({
      templateUrl: '/static/filebrowser/templates/upload-modal.html',
      controller: 'UploadModalInstanceCtrl as ctrl',
      backdrop: 'static',
      size: 'lg',
      resolve: {
        selectedDirectory: function () {
          return self.formDirPath();
        }
      }
    });

    self.modalInstance.result.then(function(){
      self.refreshDirectory();
      self.modalInstance = null;
    });

  };

  /**
   * @name self.createNewFile
   * @desc Create a new File on the Filesystem
   * @memberOf sandstone.filebrowser.FilebrowserController
   */
  self.createNewFile = function() {
    var path = self.formDirPath();
    FilesystemService.getNextUntitledFile(path, function(data){
      var newFilePath = data.result;
      // Post back new file to backend
      FilesystemService.createNewFile(newFilePath, function(data){
        self.refreshDirectory();
      });
    });
  };

  /**
   * @name self.editFileName
   * @desc Sets editing mode to True
   * @memberOf sandstone.filebrowser.FilebrowserController
   */
  self.editFileName = function() {
    self.isEditing = true;
  };

  /**
   * @name self.renameFile
   * @desc Renames the currently selected file with the edited filename
   * @memberOf sandstone.filebrowser.FilebrowserController
   */
  self.renameFile = function() {
    FilesystemService.renameFile(self.editedFileName, self.selectedFile, function(data){
      self.selectedFile.filename = self.editedFileName;
      self.selectedFile.filepath = data.result;
      self.refreshDirectory();
      self.isEditing = false;
    });
  };

  /**
   * @name self.createNewDirectory
   * @desc Creates a new directory on the filesystem
   * @memberOf sandstone.filebrowser.FilebrowserController
   */
  self.createNewDirectory = function() {
    var path = self.formDirPath();
    FilesystemService.getNextUntitledFile(path, function(data){
      var newFolderPath = data.result;
      // Post back new file to backend
      FilesystemService.createNewDir(newFolderPath, function(data){
        self.refreshDirectory();
        // FiletreeService.updateFiletree();
        $rootScope.$emit('refreshFiletree');
      });
    });
  };

  /**
   * @name self.showVolumeInfo
   * @desc returns if volume information is available or not
   * @memberOf sandstone.filebrowser.FilebrowserController
   * @returns {Boolean} true in case volume information is available. Else false
   */
  self.showVolumeInfo = function() {
    if(typeof self.volumeUsed == 'undefined') {
      return false;
    }
    return true;
  }

  self.getters = {
    filename: function (value) {
        //this will sort by the length of the first name string
        return value.filename;
    },
    size: function(value) {
      return parseFloat(value.size.split()[0]);
    }
  };

  // Get groups
  FilesystemService.getGroups(function(data, status, headers, config){
    self.groups = data;
  });

  /**
   * @name self.refreshDirectory
   * @desc Refreshes the currently selected directory, and gets the contents of the selected directory
   * @memberOf sandstone.filebrowser.
   */
  self.refreshDirectory = function() {
    // Form path
    var path = "";
    var dirpath = "";
    var i = 0;
    for(var pathComponent in self.currentDirectory) {
      if(self.currentDirectory[pathComponent] != '/')
        path = path + "/" + self.currentDirectory[pathComponent];
      i++;
    }
    path += "/";
    dirpath = path;
    FilesystemService.getFiles({'filepath': dirpath}, function(data){
      self.fileData = data;
    });
  }

  /**
   * @name self.changeDir
   * @desc Changes the currently selected directory, and get the files in the new directory
   * @param {Integer} index The index of the component of the path to navigate to
   * @memberOf sandstone.filebrowser.FilebrowserController
   */
  self.changeDir = function(index) {
    // Form path
    var path = ""
    var i = 0;
    for(var pathComponent in self.currentDirectory) {
      if(self.currentDirectory[pathComponent] != '/')
        path = path + "/" + self.currentDirectory[pathComponent];
      if(i == index) {
        break;
      }
      i++;
    }
    path += "/";
    if(!self.isNavigatable(index)) {
      return;
    }
    FilesystemService.getFiles({'filepath': path}, function(data, status, headers, config){
      self.fileData = data;
      FileService.setCurrentDirectory(path);
      self.show_details = false;
    });
  };

  /**
   * @name self.populatePermissions
   * @desc Sets the permissions for the selected file
   * @memberOf sandstone.filebrowser.FilebrowserController
   */
  self.populatePermissions = function() {
    // Perm sting looks like 644, 755 etc
    // Split it into its consituents
    var perm_array = self.selectedFile.perm_string.split('')
    // Permissions object for current file
    self.currentFilePermissions = {
      'user': {
        'r': false,
        'w': false,
        'x': false
      },
      'group': {
        'r': false,
        'w': false,
        'x': false
      },
      'others': {
        'r': false,
        'w': false,
        'x': false
      }
    };

    // TODO: Iterate over object and do in one loop instead of 3

    // User Permissions
    if(perm_array[0] == "7") {
      self.currentFilePermissions['user']['r'] = true;
      self.currentFilePermissions['user']['w'] = true;
      self.currentFilePermissions['user']['x'] = true;
    } else if(perm_array[0] == "6") {
      self.currentFilePermissions['user']['r'] = true;
      self.currentFilePermissions['user']['w'] = true;
    } else if(perm_array[0] == "5") {
      self.currentFilePermissions['user']['r'] = true;
      self.currentFilePermissions['user']['x'] = true;
    } else if(perm_array[0] == "4") {
      self.currentFilePermissions['user']['r'] = true;
    } else if(perm_array[0] == "3") {
      self.currentFilePermissions['user']['w'] = true;
      self.currentFilePermissions['user']['x'] = true;
    } else if(perm_array[0] == "2") {
      self.currentFilePermissions['user']['w'] = true;
    } else if(perm_array[0] == "1") {
      self.currentFilePermissions['user']['x'] = true;
    }

    // Group Permissions
    if(perm_array[1] == "7") {
      self.currentFilePermissions['group']['r'] = true;
      self.currentFilePermissions['group']['w'] = true;
      self.currentFilePermissions['group']['x'] = true;
    } else if(perm_array[1] == "6") {
      self.currentFilePermissions['group']['r'] = true;
      self.currentFilePermissions['group']['w'] = true;
    } else if(perm_array[1] == "5") {
      self.currentFilePermissions['group']['r'] = true;
      self.currentFilePermissions['group']['x'] = true;
    } else if(perm_array[1] == "4") {
      self.currentFilePermissions['group']['r'] = true;
    } else if(perm_array[1] == "3") {
      self.currentFilePermissions['group']['w'] = true;
      self.currentFilePermissions['group']['x'] = true;
    } else if(perm_array[1] == "2") {
      self.currentFilePermissions['group']['w'] = true;
    } else if(perm_array[1] == "1") {
      self.currentFilePermissions['group']['x'] = true;
    }

    // Others Permissions
    if(perm_array[2] == "7") {
      self.currentFilePermissions['others']['r'] = true;
      self.currentFilePermissions['others']['w'] = true;
      self.currentFilePermissions['others']['x'] = true;
    } else if(perm_array[2] == "6") {
      self.currentFilePermissions['others']['r'] = true;
      self.currentFilePermissions['others']['w'] = true;
    } else if(perm_array[2] == "5") {
      self.currentFilePermissions['others']['r'] = true;
      self.currentFilePermissions['others']['x'] = true;
    } else if(perm_array[2] == "4") {
      self.currentFilePermissions['others']['r'] = true;
    } else if(perm_array[2] == "3") {
      self.currentFilePermissions['others']['w'] = true;
      self.currentFilePermissions['others']['x'] = true;
    } else if(perm_array[2] == "2") {
      self.currentFilePermissions['others']['w'] = true;
    } else if(perm_array[2] == "1") {
      self.currentFilePermissions['others']['x'] = true;
    }
  };

  self.show_details = false;
  /**
   * @name self.ShowDetails
   * @desc Shows file details in the side pane
   * @param {String} selectedFile Contains the selected file for which the details will be shown
   * @memberOf sandstone.filebrowser.FilebrowserController
   */
  self.ShowDetails = function(selectedFile){
    self.show_details = false;
      self.selectedFile = selectedFile;
    if(self.selectedFile.is_accessible) {
      self.show_details = true;
      self.isEditing = false;
      self.editedFileName = self.selectedFile.filename;
      // Set the permissions for the file
      self.populatePermissions();
    }
  };

  /**
   * @name self.openFolder
   * @desc Open the newly selected directory on double clicking
   * @param {Object} selectedFile Contains the Directory object which will be opened
   * @memberOf sandstone.filebrowser.FilebrowserController
   */
  self.openFolder = function(selectedFile) {
    if(selectedFile.type == 'file') {
      return;
    }
    // FileService.setSelectionPath(selectedFile.filepath);
    self.treeData.selectedNodes = [selectedFile];
    self.show_details = false;
  };

  /**
   * @name self.changeGroup
   * @desc Change the group of the currently selected file
   * @memberOf sandstone.filebrowser.FilebrowserController
   */
  self.changeGroup = function(){
    var group_name = self.selectedFile.group
    var filepath = self.selectedFile.filepath
    FilesystemService.changeGroup(filepath, group_name, function(data, status, headers, config){
      console.log(data);
    });
  };

  /**
   * @name self.isNavigatable
   * @desc Returns whether the folder specified by the index can be navigated to or not
   * @memberOf sandstone.filebrowser.FilebrowserController
   * @param {Integer} index Specifies the index of the component of the current directory
   * @returns {Boolean} True if the directory can be navigated to. Else False
   */
  self.isNavigatable = function(index) {
    return index >= self.rootDirectory.length - 1;
  };

  /**
   * @name self.changePermissions
   * @desc Change the permissions for the currently selected file
   * @memberOf sandstone.filebrowser.FilebrowserController
   */
  self.changePermissions = function() {
    // Form permissions object
    var perms = ["0"];
    var keys = ['user', 'group', 'others'];
    for(var index in keys) {
      var perm = 0;
      var key = keys[index]
      if(self.currentFilePermissions[key]['r']) {
        perm += 4;
      }
      if(self.currentFilePermissions[key]['w']) {
        perm += 2;
      }
      if(self.currentFilePermissions[key]['x']) {
        perm += 1;
      }
      perms.push("" + perm);
    }
    // console.log(perms);
    // Change Permissions with FilesystemService
    FilesystemService.changePermissions(self.selectedFile.filepath, perms.join(""), function(data, status, headers, config){
      //Refresh the File table
      console.log(data);
      var path = "/" + self.currentDirectory.slice(1).join("/");
      FilesystemService.getFiles({filepath: path}, function(data, status, headers, config){
        self.fileData = data;
      });
    });
  };
}])
/**
 * @class sandstone.filebrowser.syncFocusWith
 */
.directive('syncFocusWith', function($timeout, $rootScope) {
    return {
        restrict: 'A',
        scope: {
            focusValue: "=syncFocusWith"
        },
        /**
         * @name link
         * @desc Focuses the textbox used to rename the file, on clicking the edit button
         * @memberOf sandstone.filebrowser.syncFocusWith
         * @param {Object} $scope The directive scope
         * @param {Object} $element The jqLite-wrapped element that this directive matches.
         * @param {Object} attrs Hash object with key-value pairs of normalized attribute names and their corresponding attribute values.
         * @returns {Boolean} True if the directory can be navigated to. Else False
         */
        link: function($scope, $element, attrs) {
            $scope.$watch("focusValue", function(currentValue, previousValue) {
                if (currentValue === true && !previousValue) {
                    $element[0].focus();
                } else if (currentValue === false && previousValue) {
                    $element[0].blur();
                }
            })
        }
    }
})
/**
 * @class sandstone.filebrowser.DeleteModalInstanceCtrl
 */
.controller('DeleteModalInstanceCtrl', ['FilesystemService', '$modalInstance', 'selectedFile',function (FilesystemService, $modalInstance, selectedFile) {
  var self = this;
  self.selectedFile = selectedFile;
  /**
   * @name remove
   * @desc Remove the selected files from the filesystem
   * @memberOf sandstone.filebrowser.DeleteModalInstanceCtrl
   */
  self.remove = function () {
    FilesystemService.deleteFile(self.selectedFile.filepath, function(data){
      $modalInstance.close(self.selectedFile);
    });
  };
  /**
   * @name cancel
   * @desc Cancels removing the files from the filesystem
   * @memberOf sandstone.filebrowser.DeleteModalInstanceCtrl
   */
  self.cancel = function () {
    $modalInstance.dismiss('cancel');
  };
}])
/**
 * @class sandstone.filebrowser.UploadModalInstanceCtrl
 */
.controller('UploadModalInstanceCtrl', ['FilesystemService', '$modalInstance', 'FileUploader', 'selectedDirectory',function (FilesystemService, $modalInstance, FileUploader, selectedDirectory) {
  var self = this;
  self.dirpath = selectedDirectory;
  var uploader = self.uploader = new FileUploader({
      autoUpload: true,
      url: '/supl/a/upload',
      headers: {
        'X-XSRFToken': getCookie('_xsrf'),
        'basepath': self.dirpath
      }
   });

  uploader.filters.push({
    name: 'customFilter',
    fn: function(item /*{File|FileLikeObject}*/, options) {
      return this.queue.length < 10;
    }
  });
  // Callback methods for upload events
   uploader.onWhenAddingFileFailed = function(item /*{File|FileLikeObject}*/, filter, options) {
       console.log('onWhenAddingFileFailed', item, filter, options);
   };
    uploader.onAfterAddingFile = function(fileItem) {
      fileItem.headers['uploadDir'] = self.dirpath;
      console.log('onAfterAddingFile', fileItem);
    };
   uploader.onAfterAddingAll = function(addedFileItems) {
       console.log('onAfterAddingAll', addedFileItems);
   };
   uploader.onBeforeUploadItem = function(item) {
       console.log('onBeforeUploadItem', item);
   };
   uploader.onProgressItem = function(fileItem, progress) {
       console.log('onProgressItem', fileItem, progress);
   };
   uploader.onProgressAll = function(progress) {
       console.log('onProgressAll', progress);
   };
   uploader.onSuccessItem = function(fileItem, response, status, headers) {
       console.log('onSuccessItem', fileItem, response, status, headers);
   };
   uploader.onErrorItem = function(fileItem, response, status, headers) {
       console.log('onErrorItem', fileItem, response, status, headers);
   };
   uploader.onCancelItem = function(fileItem, response, status, headers) {
       console.log('onCancelItem', fileItem, response, status, headers);
   };
   uploader.onCompleteItem = function(fileItem, response, status, headers) {
       console.log('onCompleteItem', fileItem, response, status, headers);
   };
   uploader.onCompleteAll = function() {
       console.log('onCompleteAll');
   };
   /**
    * @name cancel
    * @desc Cancels uploading the files to the filesystem
    * @memberOf sandstone.filebrowser.UploadModalInstanceCtrl
    */
  self.cancel = function () {
    $modalInstance.close();
  };
}]);
