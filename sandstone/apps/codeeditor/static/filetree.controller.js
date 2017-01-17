'use strict';

angular.module('sandstone.editor')
.controller('FiletreeCtrl', ['$modal', '$log', 'EditorService', '$rootScope', 'FilesystemService', function($modal,$log, EditorService, $rootScope, FilesystemService){
  var self = this;
  self.treeData = {
    contents: [],
    selected: [],
    expanded: []
  };

  self.sd = {
    noSelections: function() {
      return (self.treeData.selected.length == 0);
    },
    multipleSelections: function() {
      return (self.treeData.selected.length > 1);
    },
    dirSelected: function() {
      var td = self.treeData.selected;
      for (var i=0;i<td.length;i++) {
        if ( (td[i].type === 'directory') || (td[i].type === 'volume') ) {
          return true;
        }
      }
      return false;
    }
  };

  self.fcDropdown = false;

  self.clipboard = [];
  self.clipboardEmpty = function(){
    return self.clipboard.length === 0;
  };

  self.openFilesInEditor = function () {
    //FiletreeService.openFilesInEditor();
    var treeData = self.treeData.selected;
    for(var i = 0; i < treeData.length; i++) {
      EditorService.openDocument(treeData[i].filepath);
      $log.debug('Opened document: ', treeData[i].filepath);
    }
  };

  self.createNewFile = function () {
    var selectedDir = self.treeData.selected[0];
    var createModalInstance = $modal.open({
      templateUrl: '/static/editor/templates/create-modal.html',
      backdrop: 'static',
      keyboard: false,
      controller: 'CreateModalCtrl as ctrl',
      resolve: {
        action: function () {
          return {
            type: 'File',
            baseDirectory: selectedDir,
            filename: 'Untitled'
          };
        }
      }
    });

    createModalInstance.result.then(function (newFileName) {
      var newPath;
      if (selectedDir.filepath.slice(-1) !== '/') {
        newPath = selectedDir.filepath + '/' + newFileName;
      } else {
        newPath = selectedDir.filepath + newFileName;
      }
      FilesystemService.createFile(newPath,function(uri){
        $log.debug('File created at: ' + newPath);
      });
    }, function () {
      $log.debug('Modal dismissed at: ' + new Date());
    });
  };
  self.createNewDir = function () {
    var selectedDir = self.treeData.selected[0];
    var createModalInstance = $modal.open({
      templateUrl: '/static/editor/templates/create-modal.html',
      backdrop: 'static',
      keyboard: false,
      controller: 'CreateModalCtrl as ctrl',
      resolve: {
        action: function () {
          return {
            type: 'Directory',
            baseDirectory: selectedDir,
            filename: 'UntitledDir'
          };
        }
      }
    });

    createModalInstance.result.then(function (newFileName) {
      var newPath;
      if (selectedDir.filepath.slice(-1) !== '/') {
        newPath = selectedDir.filepath + '/' + newFileName;
      } else {
        newPath = selectedDir.filepath + newFileName;
      }
      FilesystemService.createDirectory(newPath,function(uri){
        $log.debug('Directory created at: ' + newPath);
      });
    }, function () {
      $log.debug('Modal dismissed at: ' + new Date());
    });
  };
  self.createDuplicate = function () {
    var selectedFile = self.treeData.selected[0];
    var createModalInstance = $modal.open({
      templateUrl: '/static/editor/templates/create-modal.html',
      backdrop: 'static',
      keyboard: false,
      controller: 'CreateModalCtrl as ctrl',
      resolve: {
        action: function () {
          return {
            type: selectedFile.type,
            baseDirectory: selectedFile.dirpath,
            filename: selectedFile.name,
            action: 'duplicate'
          };
        }
      }
    });

    createModalInstance.result.then(function (newFileName) {
      var newPath;
      if (selectedFile.dirpath.slice(-1) !== '/') {
        newPath = selectedFile.dirpath + '/' + newFileName;
      } else {
        newPath = selectedFile.dirpath + newFileName;
      }
      if (selectedFile.type === 'directory') {
        FilesystemService.createDirectory(newPath,function(uri){
          $log.debug('Directory duplicated at: ' + newPath);
        });
      } else if (selectedFile.type === 'file') {
        FilesystemService.createFile(newPath,function(uri){
          $log.debug('File duplicated at: ' + newPath);
        });
      }
    }, function () {
      $log.debug('Modal dismissed at: ' + new Date());
    });
  };

  self.delete = function () {
    self.deleteModalInstance = $modal.open({
      templateUrl: '/static/editor/templates/delete-modal.html',
      backdrop: 'static',
      keyboard: false,
      controller: 'DeleteModalCtrl as ctrl',
      resolve: {
        files: function () {
          return self.treeData.selected;
        }
      }
    });

    self.deleteModalInstance.result.then(function () {
      for (var i=0;i<self.treeData.selected.length;i++) {
        var filepath = self.treeData.selected[i].filepath;
        FilesystemService.delete(filepath,function(){
          $log.debug('Deleted file: ',filepath);
        });
        self.deleteModalInstance = null;
      }
    }, function () {
      self.deleteModalInstance = null;
    });
  };
  self.copy = function () {
    var node, i;
    self.clipboard = [];
    for (i=0;i<self.treeData.selected.length;i++) {
      node = self.treeData.selected[i]
      self.clipboard.push(node);
    }
    $log.debug('Copied ', i, ' files to clipboard: ', self.clipboard);
  };

  self.paste = function () {
    var node;
    var i = 0;
    var newDirPath = self.treeData.selected[0].filepath;
    if (newDirPath.slice(-1) !== '/') {
      newDirPath += '/';
    }
    while (self.clipboard.length > 0) {
      node = self.clipboard.shift();
      FilesystemService.copy(node.filepath,newDirPath+node.name,function() {});
    }
  };

  self.rename = function () {
    var renameModalInstance = $modal.open({
      templateUrl: '/static/editor/templates/rename-modal.html',
      backdrop: 'static',
      keyboard: false,
      controller: 'RenameModalCtrl as ctrl',
      resolve: {
        files: function () {
          return self.treeData.selected;
        }
      }
    });

    renameModalInstance.result.then(function (newFileName) {
      $log.debug('File renamed at: ' + new Date());
      var node = self.treeData.selected[0];
      FilesystemService.rename(node.filepath,newFileName,function(){});
    }, function () {
      $log.debug('Modal dismissed at: ' + new Date());
    });
  };


}])
.controller('CreateModalCtrl', function ($modalInstance, action) {
  var self = this;
  self.action = action.action;
  self.type = action.type;
  self.baseDirectory = action.baseDirectory;
  if (action.hasOwnProperty('filename')) {
    self.newFileName = action.filename;
  } else {
    self.newFileName = 'Untitled';
  }

  self.create = function () {
    $modalInstance.close(self.newFileName);
  };

  self.cancel = function () {
    $modalInstance.dismiss('cancel');
  };
})
.controller('RenameModalCtrl', function ($modalInstance, files) {
  var self = this;
  self.files = files;
  self.newFileName = files[0].filename;

  self.rename = function () {
    $modalInstance.close(self.newFileName);
  };

  self.cancel = function () {
    $modalInstance.dismiss('cancel');
  };
});
