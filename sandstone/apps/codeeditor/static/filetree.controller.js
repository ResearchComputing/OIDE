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
        if (td[i].type === 'directory') {
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

  // Callback of invocation to FilesystemService to get the next Untitled FIle
  // Invoke the FilesystemService to create the new file
  self.gotNewUntitledFile = function(data, status, headers, config) {
    $log.debug('GET: ', data);
    var newFilePath = data.result;
    // Post back new file to backend
    FilesystemService.createNewFile(newFilePath, self.createFileCallback);
  };

  // Callback for getting the next duplicated file for selected file
  self.gotNextDuplicateFile = function(data, status, headers, config) {
    $log.debug('GET: ', data);
     var newFilePath = data.result;
     FilesystemService.duplicateFile(data.originalFile, newFilePath, self.duplicatedFile);
  };

  self.createNewFile = function () {
    //Invokes filesystem service to create a new file
    var selectedDir = self.treeData.selectedNodes[0].filepath;
    FilesystemService.getNextUntitledFile(selectedDir, self.gotNewUntitledFile);
  };
  self.createNewDir = function () {
    var selectedDir = self.treeData.selectedNodes[0].filepath;
    FilesystemService.getNextUntitledDir(selectedDir, self.gotNewUntitledDir);
  };
  self.createDuplicate = function () {
    var selectedFile = self.treeData.selectedNodes[0].filepath;
    FilesystemService.getNextDuplicate(selectedFile, self.gotNextDuplicateFile);
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
    while (self.clipboard.length > 0) {
      node = self.clipboard.shift();
      FilesystemService.copy(node.filepath,newDirPath+node.filename,function() {});
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
