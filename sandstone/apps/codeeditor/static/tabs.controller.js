'use strict';

angular.module('sandstone.editor')

.controller('EditorTabsCtrl', ['$scope', '$uibModal', '$log', 'EditorService', 'FilesystemService', '$rootScope', '$document',
  function ($scope, $uibModal, $log, EditorService, FilesystemService, $rootScope, $document) {
    var self = this;

    $scope.$watch(
      function() {
        var currentDoc = EditorService.getCurrentDoc();
        var doc = EditorService.getOpenDocs(currentDoc);
        if (doc.changedOnDisk) {
          return currentDoc;
        }
      },
      function(newValue) {
        if (newValue) {
          self.promptChangedOnDisk(newValue);
        }
      }
    );

    self.promptChangedOnDisk = function(filepath) {
      self.changedModalInstance = $uibModal.open({
        templateUrl: '/static/editor/templates/file-changed-modal.html',
        backdrop: 'static',
        keyboard: false,
        controller: 'ChangedModalCtrl',
        resolve: {
          file: function () {
            return filepath;
          }
        }
      });

      self.changedModalInstance.result.then(function(action) {
        if (action.save) {
          var documentSaved = EditorService.saveDocument(action.filepath);
          documentSaved.then(
            function() {},
            function(res) {
              if (res.status == 404) {
                self.saveDocumentAs(action.filepath);
              }
            }
          );
        } else {
          $log.info('File reloaded');
        }
      });
    };

    self.getOpenDocs = function() {
      return EditorService.getOpenDocs();
    };

    self.getCurrentDoc = function() {
      return EditorService.getCurrentDoc();
    };

    self.openDocument = function (filepath) {
      var fp = filepath || undefined;
      if (fp) {
        EditorService.setSession(fp);
      } else {
        var documentOpened = EditorService.openDocument(fp);
        documentOpened.then(function(newFilepath) {
          EditorService.setSession(newFilepath);
        });
      }
    };
    self.closeDocument = function ($event, tab) {
      $event.preventDefault();
      if (tab.unsaved) {
        self.unsavedModalInstance = $uibModal.open({
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
            if (FilesystemService.isAbsolute(tab.filepath)) {
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
    self.saveDocumentAs = function (filepath) {
      self.saveAsModalInstance = $uibModal.open({
        templateUrl: '/static/editor/templates/saveas-modal.html',
        backdrop: 'static',
        keyboard: false,
        size: 'lg',
        controller: 'SaveAsModalCtrl',
        controllerAs: 'ctrl',
        resolve: {
          file: function () {
            var dirpath = FilesystemService.dirname(filepath);
            var filename = FilesystemService.basename(filepath);
            var file = {
              name: filename,
              dirpath: dirpath
            };
            return file;
          }
        }
      });

      self.saveAsModalInstance.result.then(function (saveFilepath) {
        EditorService.fileRenamed(filepath,saveFilepath);
        EditorService.saveDocument(saveFilepath);
        $log.debug('Saved files at: ' + new Date());
        self.saveAsModalInstance = null;
      }, function () {
        $log.debug('Modal dismissed at: ' + new Date());
        self.saveAsModalInstance = null;
      });
    };
    self.saveDocument = function (tab) {
      if(!FilesystemService.isAbsolute(tab.filepath)) {
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
.controller('SaveAsModalCtrl', function ($scope, $uibModalInstance, $http, file, FilesystemService) {
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
    var valid = (self.newFile.name.length && self.newFile.dirpath.length);
    valid = valid && (FilesystemService.isAbsolute(self.newFile.dirpath));
    return valid;
  };

  self.saveAs = function () {
    var filepath;
    var dirpath = FilesystemService.normalize(self.newFile.dirpath);

    filepath = FilesystemService.join(dirpath,self.newFile.name);
    $uibModalInstance.close(filepath);
  };

  self.cancel = function () {
    $uibModalInstance.dismiss('cancel');
  };
})
.controller('UnsavedModalCtrl', function ($scope, $uibModalInstance, file) {

  $scope.file = file;

  $scope.save = function () {
    $scope.file.saveFile = true;
    $uibModalInstance.close($scope.file);
  };

  $scope.close = function () {
    $scope.file.saveFile = false;
    $uibModalInstance.close($scope.file);
  };

  $scope.cancel = function () {
    $uibModalInstance.dismiss('cancel');
  };
})
.controller('ChangedModalCtrl', function ($scope, $uibModalInstance, file) {

  $scope.action = {
    filepath: file,
    save: true
  };

  $scope.save = function () {
    $scope.action.save = true;
    $uibModalInstance.close($scope.action);
  };

  $scope.load = function () {
    $scope.action.save = false;
    $uibModalInstance.close($scope.action);
  };

  $scope.cancel = function () {
    $uibModalInstance.dismiss('cancel');
  };
})
.controller('DeleteModalCtrl', function ($uibModalInstance, files) {
  var self =  this;
  self.files = files;

  self.remove = function () {
    $uibModalInstance.close();
  };

  self.cancel = function () {
    $uibModalInstance.dismiss('cancel');
  };
})
