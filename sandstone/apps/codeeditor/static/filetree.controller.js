'use strict';

angular.module('sandstone.editor')
.controller('FiletreeCtrl', ['$modal', '$log', '$scope', '$document', 'EditorService', '$rootScope', 'FilesystemService', function($modal, $log, $scope, $document, EditorService, $rootScope, FilesystemService){
  var self = this;
  self.treeData = EditorService.treeData;
  self.treeOptions = EditorService.treeOptions;

  // Toggle multi-selection when meta or control keys are pressed
  var filetreeKeydown = function(event) {
    if (event.key === 'Meta' || event.key === 'Control') {
      self.treeOptions.multiSelection = true;
      $scope.$digest();
    }
  };
  var filetreeKeyup = function(event) {
    if (event.key === 'Meta' || event.key === 'Control') {
      self.treeOptions.multiSelection = false;
      $scope.$digest();
    }
  };
  $document.on('keydown',filetreeKeydown);
  $document.on('keyup',filetreeKeyup);
  $scope.$on('$destroy', function () {
    $document.off('keydown',filetreeKeydown);
  });
  $scope.$on('$destroy', function () {
    $document.off('keyup',filetreeKeyup);
  });
  // End of multiselection code

  self.sd = {
    noSelections: function() {
      return (self.treeData.selected.length === 0);
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
      var documentOpened = EditorService.openDocument(treeData[i].filepath);
      documentOpened.then(function(filepath) {
        EditorService.setSession(filepath);
        $log.debug('Opened document: ', filepath);
      });
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
      var newPath, normDirpath;
      normDirpath = FilesystemService.normalize(selectedDir.filepath);
      newPath = FilesystemService.join(normDirpath,newFileName);

      var createFile = FilesystemService.createFile(newPath);
      createFile.then(
        function(uri){
          $log.debug('File created at: ' + newPath);
        }
      );
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
      var newPath, normDirpath;
      normDirpath = FilesystemService.normalize(selectedDir.filepath);
      newPath = FilesystemService.join(normDirpath,newFileName);

      var createDirectory = FilesystemService.createDirectory(newPath);
      createDirectory.then(
        function(uri){
          $log.debug('Directory created at: ' + newPath);
        }
      );
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
      var newPath, normDirpath;
      normDirpath = FilesystemService.normalize(selectedFile.dirpath);
      newPath = FilesystemService.join(normDirpath,newFileName);

      if (selectedFile.type === 'directory') {
        var createDirectory = FilesystemService.createDirectory(newPath);
        createDirectory.then(
          function(uri){
            $log.debug('Directory duplicated at: ' + newPath);
          }
        );
      } else if (selectedFile.type === 'file') {
        var createFile = FilesystemService.createFile(newPath);
        createFile.then(
          function(uri){
            $log.debug('File duplicated at: ' + newPath);
          }
        );
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
        var deleteFile = FilesystemService.delete(filepath);
        deleteFile.then(
          function(){
            $log.debug('Deleted file: ',filepath);
          }
        );
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
    var node, destPath;
    var i = 0;
    var newDirPath = FilesystemService.normalize(self.treeData.selected[0].filepath);

    while (self.clipboard.length > 0) {
      node = self.clipboard.shift();
      destPath = FilesystemService.join(newDirPath,node.name);
      var copyFile = FilesystemService.copy(node.filepath,destPath);
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
      var renameFile = FilesystemService.rename(node.filepath,newFileName);
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
