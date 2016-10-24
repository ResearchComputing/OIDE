'use strict';

angular.module('sandstone.editor')
.controller('FiletreeCtrl', ['$modal', '$log', 'EditorService', '$rootScope', 'FilesystemService', function($modal,$log, EditorService, $rootScope, FilesystemService){
  var self = this;
  self.treeData = {
    filetreeContents: [
      // { "type": "dir", "filepath": "/tmp/", "filename" : "tmp", "children" : []}
    ]
  };

  self.sd = {
    noSelections: true,
    multipleSelections: false,
    dirSelected: false
  };

  self.fcDropdown = false;
  self.clipboard = [];
  self.clipboardEmpty = function(){
    return self.clipboard.length === 0;
  };

  self.updateFiletree = function () {
    // for (var i=0;i<self.treeData.expandedNodes.length;i++) {
    //   self.getDirContents(self.treeData.expandedNodes[i]);
    // }
    $rootScope.$emit('refreshFiletree');
  };

  self.openFilesInEditor = function () {
    //FiletreeService.openFilesInEditor();
    var treeData = self.treeData.selectedNodes;
    for(var i = 0; i < treeData.length; i++) {
      EditorService.openDocument(treeData[i].filepath);
      $log.debug('Opened document: ', treeData[i].filepath);
    }
  };

  // Callback of invocation to FilesystemService to create a file
  // Update the filetree to show the new file
  self.createFileCallback = function(data, status, headers, config){
    $log.debug('POST: ', data);
    $rootScope.$emit('refreshFiletree');
  };

  // Callback for invoking the FilesystemService to create a new folder
  // Update the filetree to show the new folder
  self.createFolderCallback = function(data, status, headers, config) {
      $log.debug('POST: ', data);
      $rootScope.$emit('refreshFiletree');
  }

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

  // Callback for getting the next duplicate folder name
  self.gotNewUntitledDir = function(data) {
      var newFolderPath = data.result;
      FilesystemService.createNewDir(newFolderPath, self.createFolderCallback);
  }

  // Callback for duplicating a file
  self.duplicatedFile = function(data, status, headers, config) {
    $log.debug('Copied: ', data.result);
    self.updateFiletree();
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

  $rootScope.$on('fileRenamed',function(event, oldPath, newPath){
    EditorService.fileRenamed(oldPath, newPath);
  });

  $rootScope.$on('fileDeleted', function(event, path){
    EditorService.fileDeleted(path);
  });

  self.deletedFile = function(data, status, headers, config, node) {
    $rootScope.$emit('deletedFile', data, status, headers, config, node);
  };

  self.deleteFiles = function () {
    self.deleteModalInstance = $modal.open({
      templateUrl: '/static/editor/templates/delete-modal.html',
      backdrop: 'static',
      keyboard: false,
      controller: 'DeleteModalCtrl as ctrl',
      resolve: {
        files: function () {
          return self.treeData.selectedNodes;
        }
      }
    });

    self.deleteModalInstance.result.then(function () {
      $log.debug('Files deleted at: ' + new Date());
      for (var i=0;i<self.treeData.selectedNodes.length;i++) {
        var filepath = self.treeData.selectedNodes[i].filepath;
        FilesystemService.deleteFile(filepath, self.deletedFile);
        self.deleteModalInstance = null;
      }
    }, function () {
      $log.debug('Modal dismissed at: ' + new Date());
      self.deleteModalInstance = null;
    });
  };
  self.copyFiles = function () {
    var node, i;
    for (i=0;i<self.treeData.selectedNodes.length;i++) {
      node = self.treeData.selectedNodes[i]
      self.clipboard.push({
        'filename': node.filename,
        'filepath': node.filepath
      });
    }
    $log.debug('Copied ', i, ' files to clipboard: ', self.clipboard);
  };

  // Callback for invocation to FilesystemService pasteFile method
  self.pastedFiles = function(data, status, headers, config, node){
    $log.debug('POST: ', data.result);
  };

  self.pasteFiles = function () {
    var i;
    var newDirPath = self.treeData.selectedNodes[0].filepath;
    for (i=0;i<self.clipboard.length;i++) {
      FilesystemService.pasteFile(self.clipboard[i].filepath, newDirPath + self.clipboard[i].filename, self.pastedFiles);
    }
    self.clipboard = [];
    $rootScope.$emit('pastedFiles', newDirPath);
  };

  self.fileRenamed = function(data, status, headers, config, node) {
    $rootScope.$emit('fileRenamed', node.filepath, data.result);
    self.updateFiletree();
    $log.debug('POST: ', data.result);
  };

  self.renameFile = function () {
    var renameModalInstance = $modal.open({
      templateUrl: '/static/editor/templates/rename-modal.html',
      backdrop: 'static',
      keyboard: false,
      controller: 'RenameModalCtrl as ctrl',
      resolve: {
        files: function () {
          return self.treeData.selectedNodes;
        }
      }
    });

    renameModalInstance.result.then(function (newFileName) {
      $log.debug('Files renamed at: ' + new Date());
      var node = self.treeData.selectedNodes[0];
      FilesystemService.renameFile(newFileName, node, self.fileRenamed);
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
