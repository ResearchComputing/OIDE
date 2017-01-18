'use strict';

angular.module('sandstone.editor')

.controller('EditorTabsCtrl', ['$scope', '$modal', '$log', 'EditorService', '$rootScope', '$document',
  function ($scope, $modal, $log, EditorService, $rootScope, $document) {
    var self = this;
    self.getOpenDocs = function() {
      return EditorService.getOpenDocs();
    };
    self.openDocument = function (filepath) {
      var fp = filepath || undefined;
      EditorService.openDocument(fp);
    };
    self.closeDocument = function ($event, tab) {
      $event.preventDefault();
      if (tab.unsaved) {
        self.unsavedModalInstance = $modal.open({
          templateUrl: '/static/editor/templates/close-unsaved-modal.html',
          backdrop: 'static',
          keyboard: false,
          controller: 'UnsavedModalCtrl',
          resolve: {
            file: function () {
              return tab;
            }
          }
        });

        self.unsavedModalInstance.result.then(function (file) {
          if (file.saveFile) {
            if (tab.filepath.substring(0,2) !== '-/') {
              EditorService.saveDocument(file.filepath);
              $log.debug('Saved files at: ' + new Date());
              EditorService.closeDocument(file.filepath);
            } else {
              self.saveDocumentAs(file);
            }
          } else {
            $log.debug('Closed without saving at: ' + new Date());
            EditorService.closeDocument(file.filepath);
          }
          self.unsavedModalInstance = null;
        }, function () {
          $log.debug('Modal dismissed at: ' + new Date());
          self.unsavedModalInstance = null;
        });
      } else {
        EditorService.closeDocument(tab.filepath);
      }
    };
    self.saveDocumentAs = function (tab) {
      self.saveAsModalInstance = $modal.open({
        templateUrl: '/static/editor/templates/saveas-modal.html',
        backdrop: 'static',
        keyboard: false,
        size: 'lg',
        controller: 'SaveAsModalCtrl',
        controllerAs: 'ctrl',
        resolve: {
          file: function () {
            var dirpath = tab.filepath.replace(tab.filename,'');
            var file = {
              name: tab.filename,
              dirpath: dirpath
            };
            return file;
          }
        }
      });

      self.saveAsModalInstance.result.then(function (filepath) {
        EditorService.fileRenamed(tab.filepath,filepath);
        EditorService.saveDocument(filepath);
        $log.debug('Saved files at: ' + new Date());
        self.saveAsModalInstance = null;
      }, function () {
        $log.debug('Modal dismissed at: ' + new Date());
        self.saveAsModalInstance = null;
      });
    };
    self.saveDocument = function (tab) {
      if(tab.filepath.substring(0,2) == '-/') {
        self.saveDocumentAs(tab);
      } else {
        EditorService.saveDocument(tab.filepath);
      }
    };
    self.undoChanges = function (tab) {
      EditorService.undoChanges(tab.filepath);
    };
    self.redoChanges = function (tab) {
      EditorService.redoChanges(tab.filepath);
    };
    self.copySelection = function () {
      EditorService.copySelection();
    };
    self.cutSelection = function () {
      EditorService.cutSelection();
    };
    self.pasteClipboard = function () {
      EditorService.pasteClipboard();
    };
    self.commentSelection = function () {
      EditorService.commentSelection();
    };
    self.openSearchBox = function () {
      EditorService.openSearchBox();
    };

    $document.on('keydown', function(e) {
      if(e.ctrlKey && (e.which == 83)) {
        var currentTab = EditorService.getCurrentDoc();
        var tab = {
          filepath: currentTab
        };
        if(e.shiftKey) {
          self.saveDocumentAs(tab)
        } else {
          self.saveDocument(tab);
        }
        event.preventDefault();
        return false;
      }
    });

  }])
.controller('SaveAsModalCtrl', function ($scope, $modalInstance, $http, file) {
  var self = this;
  self.treeData = {
    contents: [],
    selected: [],
    expanded: []
  };

  self.filetreeOnSelect = function(node,selected) {
    if (selected) {
      if ( (node.type === 'directory') || (node.type === 'volume') ) {
        self.newFile.dirpath = node.filepath;
      } else {
        self.newFile.dirpath = node.dirpath;
        self.newFile.name = node.name;
      }
    }
  };

  self.newFile = {
    name: file.name,
    dirpath: file.dirpath
  };

  self.validFilepath = function() {
    var valid = (self.newFile.name.length > 0 && self.newFile.dirpath.length > 0);
    valid = valid && (self.newFile.dirpath.substring(0,1) !== '-');
    return valid;
  };

  self.saveAs = function () {
    var filepath;
    var dirpath = self.newFile.dirpath;
    if (dirpath.slice(-1) !== '/') {
      dirpath += '/';
    }
    filepath = dirpath + self.newFile.name;
    $modalInstance.close(filepath);
  };

  self.cancel = function () {
    $modalInstance.dismiss('cancel');
  };
})
.controller('UnsavedModalCtrl', function ($scope, $modalInstance, file) {

  $scope.file = file;

  $scope.save = function () {
    $scope.file.saveFile = true;
    $modalInstance.close($scope.file);
  };

  $scope.close = function () {
    $scope.file.saveFile = false;
    $modalInstance.close($scope.file);
  };

  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };
})
.controller('DeleteModalCtrl', function ($modalInstance, files) {
  var self =  this;
  self.files = files;

  self.remove = function () {
    $modalInstance.close();
  };

  self.cancel = function () {
    $modalInstance.dismiss('cancel');
  };
})
