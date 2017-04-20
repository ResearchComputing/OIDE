'use strict';

angular.module('sandstone.filebrowser')

.directive('fbFileDetails', [function() {
  return {
    restrict: 'A',
    scope: {},
    templateUrl: '/static/filebrowser/fb-filedetails/fb-filedetails.html',
    controller: ['$scope', '$element', '$modal', 'FilesystemService', 'FilebrowserService', 'BroadcastService', 'AlertService', function($scope,$element,$modal,FilesystemService,FilebrowserService,BroadcastService,AlertService) {
      var self = $scope;

      var permStringToModel = function(perms) {
        var permModel = {};
        for (var i=0;i<9;i++) {
          permModel[i] = (perms[i] !== '-')
        }
        return permModel;
      };

      self.filesystem = {};
      $scope.$watch(function() {
        return FilebrowserService.getFilesystem();
      }, function(newValue) {
        self.filesystem = newValue;
      });

      self.selection = {};
      self.editFile = {};
      $scope.$watch(function() {
        return FilebrowserService.getSelection();
      }, function(newValue) {
        self.selection = newValue;
        // Create a deep copy of the selected file for editing
        if(!self.selection.selectedFile) {
          self.editFile = {};
        } else {
          self.editFile = angular.copy(newValue.selectedFile);
          if (self.editFile) {
            self.editFile.permModel = permStringToModel(self.editFile.permissions);
          }
        }
      },true);

      // File Details
      self.editingName = false;
      self.renameFile = function() {
        FilesystemService
          .rename(self.selection.selectedFile.filepath,self.editFile.name)
          .then(function(newpath) {
            // Update file details prior to reselection since the
            // filepath has now changed.
            FilesystemService
              .getFileDetails(newpath)
              .then(function(file) {
                angular.extend(self.selection.selectedFile,file);
                FilebrowserService.setSelectedFile(self.selection.selectedFile);
              },
              function(data) {
                AlertService.addAlert({
                  type: 'warning',
                  message: 'Failed to retrieve file details.'
                });
                FilebrowserService.setSelectedFile();
              });
          },
          function(data) {
            // Show an alert and roll back changes to the editFile
            AlertService.addAlert({
              type: 'danger',
              message: 'Error while trying to rename file.'
            });
            self.editFile.name = self.selection.selectedFile.name;
          });
      };

      self.changeGroup = function() {
        FilesystemService
          .changeGroup(self.selection.selectedFile.filepath,self.editFile.group)
          .then(function() {
            self.selection.selectedFile.group = self.editFile.group;
            FilebrowserService.setSelectedFile(self.selection.selectedFile);
          },
          function(data) {
            // Show an alert and roll back changes to the editFile
            AlertService.addAlert({
              type: 'danger',
              message: 'Error while trying to change group.'
            });
            self.editFile.group = self.selection.selectedFile.group;
          });
      }

      self.changePermissions = function() {
        var base = 'rwxrwxrwx';
        var perms = '';
        for (var i=0;i<9;i++) {
          if (!self.editFile.permModel[i]) {
            perms = perms + '-';
          } else {
            perms = perms + base[i];
          }
        }
        FilesystemService
          .changePermissions(self.selection.selectedFile.filepath,perms)
          .then(function() {
            self.selection.selectedFile.permissions = perms;
            FilebrowserService.setSelectedFile(self.selection.selectedFile);
          },
          function(data) {
            // Show an alert and roll back changes to the editFile
            AlertService.addAlert({
              type: 'danger',
              message: 'Error while trying to change permissions.'
            });
            self.editFile.permModel = permStringToModel(self.selection.selectedFile.permissions);
          });
      };

      self.openInEditor = function() {
        var message = {
            key: 'editor:open-document',
            data: {
                filepath: self.selection.selectedFile.filepath
            }
        };
        BroadcastService.sendMessage(message);
        window.location.href = '#/editor';
      };

      self.duplicate = function() {
        var cwd = self.selection.cwd;
        var dupFile = self.selection.selectedFile;
        var basepath = FilesystemService.join(cwd.filepath,dupFile.name);
        var exists = false;
        var i = 0;
        var suffix;
        do {
          i++;
          exists = false;
          suffix = ' ('+i+')';
          for (var ci=0;ci<cwd.contents.length;ci++) {
            if (cwd.contents[ci].filepath === (basepath + suffix)) {
              exists = true;
              break;
            }
          }
        } while (exists);
        FilesystemService
          .copy(self.selection.selectedFile.filepath,basepath+suffix)
          .then(function(copypath) {
            FilebrowserService.setSelectedFile(self.selection.selectedFile);
          },
          function(data) {
            AlertService.addAlert({
              type: 'danger',
              message: 'Failed to duplicate file.'
            });
          });
      };

      self.move = function() {
        var moveModalInstance = $modal.open({
          templateUrl: '/static/filebrowser/templates/move-modal.html',
          backdrop: 'static',
          keyboard: false,
          size: 'lg',
          controller: 'MoveModalInstanceCtrl',
          controllerAs: 'ctrl',
          resolve: {
            file: function () {
              return self.selection.selectedFile
            }
          }
        });

        moveModalInstance.result.then(function (newpath) {
          FilesystemService
            .move(self.selection.selectedFile.filepath,newpath)
            .then(function(filepath) {},
            function(data) {
              AlertService.addAlert({
                type: 'danger',
                message: 'Failed to move file.'
              });
            });
        });
      };

      self.delete = function() {
        self.deleteModalInstance = $modal.open({
          templateUrl: '/static/filebrowser/templates/delete-modal.html',
          backdrop: 'static',
          keyboard: false,
          controller: 'DeleteModalInstanceCtrl as ctrl',
          resolve: {
            file: function () {
              return self.selection.selectedFile;
            }
          }
        });

        self.deleteModalInstance.result.then(function (file) {
          FilesystemService
            .delete(self.selection.selectedFile.filepath)
            .then(function() {
              FilebrowserService.setSelectedFile(file);
            },
            function(data) {
              AlertService.addAlert({
                type: 'danger',
                message: 'Failed to delete file.'
              });
            });
        }, function () {
          self.deleteModalInstance = null;
        });
      };

    }]
  };
}]);
