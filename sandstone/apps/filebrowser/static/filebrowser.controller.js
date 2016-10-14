'use strict';

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
        if(node[0].type === 'volume') {
            FileService.setCurrentDirectory(node[0].name);
            // Get the list of files from FilesystemService
            FilesystemService.getFiles(node[0], self.gotFiles);
            FilesystemService.getVolumeInfo(node[0].name, self.gotVolumeInfo);
        } else {
            FileService.setCurrentDirectory(node[0].filepath);
            // Get the list of files from FilesystemService
            FilesystemService.getFiles(node[0], self.gotFiles);
            FilesystemService.getVolumeInfo(node[0].filepath, self.gotVolumeInfo);                   
        }
        // Get Root Directory
        // FilesystemService.getRootDirectory(node[0].filepath, self.gotRootDirectory);
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
  self.copyFile = function() {
    self.copiedFile = self.selectedFile;
    self.isCopied = true;
  };

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

  self.gotFiles = function(data, status, headers, config) {
    FileService.setFileData(data);
  };
  self.gotRootDirectory = function(data, status, headers, config) {
    var rootDirectory = data.result;
    FileService.setRootDirectory(rootDirectory);
  };

  self.gotVolumeInfo = function(data, status, headers, config) {
    var volumeInfo = data.result;
    FileService.setVolumeInfo(volumeInfo);
  };

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

  self.duplicateFile = function(){
    FilesystemService.getNextDuplicate(self.selectedFile.filepath, function(data){
      FilesystemService.duplicateFile(data.originalFile, data.result, function(data){
        // Refresh Filetree
        self.refreshDirectory();
      });
    });
  };

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

  self.editFileName = function() {
    self.isEditing = true;
  };

  self.renameFile = function() {
    FilesystemService.renameFile(self.editedFileName, self.selectedFile, function(data){
      self.selectedFile.filename = self.editedFileName;
      self.selectedFile.filepath = data.result;
      self.refreshDirectory();
      self.isEditing = false;
    });
  };

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

  self.openFolder = function(selectedFile) {
    if(selectedFile.type == 'file') {
      return;
    }
    // FileService.setSelectionPath(selectedFile.filepath);
    self.treeData.selectedNodes = [selectedFile];
    self.show_details = false;
  };

  self.changeGroup = function(){
    var group_name = self.selectedFile.group
    var filepath = self.selectedFile.filepath
    FilesystemService.changeGroup(filepath, group_name, function(data, status, headers, config){
      console.log(data);
    });
  };

  self.isNavigatable = function(index) {
    return index >= self.rootDirectory.length - 1;
  };

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
.directive('syncFocusWith', function($timeout, $rootScope) {
    return {
        restrict: 'A',
        scope: {
            focusValue: "=syncFocusWith"
        },
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
.controller('DeleteModalInstanceCtrl', ['FilesystemService', '$modalInstance', 'selectedFile',function (FilesystemService, $modalInstance, selectedFile) {
  var self = this;
  self.selectedFile = selectedFile;
  self.remove = function () {
    FilesystemService.deleteFile(self.selectedFile.filepath, function(data){
      $modalInstance.close(self.selectedFile);
    });
  };

  self.cancel = function () {
    $modalInstance.dismiss('cancel');
  };
}])
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

  self.cancel = function () {
    $modalInstance.close();
  };
}]);
