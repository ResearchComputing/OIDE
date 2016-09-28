'use strict';

angular.module('sandstone.editor')
.controller('FiletreeCtrl', ['$modal', '$log', 'EditorService', '$rootScope', 'FilesystemService', 'BroadcastService', function($modal,$log, EditorService, $rootScope, FilesystemService, BroadcastService){
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

  // Callback for duplicating a file
  self.duplicatedFile = function(data, status, headers, config) {
    $log.debug('Copied: ', data.result);
    self.updateFiletree();
  };

  self.createNewFile = function () {
    //Invokes filesystem service to create a new file
    var selectedDir = self.treeData.selectedNodes[0].filepath;
    var message = {
        'key': 'filetree:get_untitled_file',
        'data': {
            'filepath': selectedDir
        }
    };
    BroadcastService.sendMessage(message);
  };
  self.createNewDir = function () {
    var selectedDir = self.treeData.selectedNodes[0].filepath;
    // FilesystemService.getNextUntitledDir(selectedDir, self.gotNewUntitledDir);
    var message = {
        'key': 'filetree:get_untitled_dir',
        'data': {
            'dirpath': selectedDir
        }
    };
    BroadcastService.sendMessage(message);
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
        var selectedFiles = [];
        self.treeData.selectedNodes.forEach(function(node) {
            selectedFiles.push(node.filepath);
        });
        var message = {
            key: 'filetree:delete_files',
            data: {
                files: selectedFiles
            }
        };
        BroadcastService.sendMessage(message);
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

  self.pasteFiles = function () {
    var i;
    var newDirPath = self.treeData.selectedNodes[0].filepath;
    var copiedNodes = [];
    self.clipboard.forEach(function(node) {
        copiedNodes.push(node);
    });
    var message = {
        key: 'filetree:paste_files',
        data: {
            nodes: copiedNodes,
            newDirPath: newDirPath
        }
    };
    BroadcastService.sendMessage(message);
    self.clipboard = [];
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
      var message = {
          key: 'filetree:rename',
          data: {
              newFileName: newFileName,
              filepath: node.filepath
          }
      };
      BroadcastService.sendMessage(message);
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
