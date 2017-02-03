'use strict';

angular.module('sandstone.filebrowser')

.directive('fbFileDetails', [function() {
  return {
    restrict: 'A',
    scope: {},
    templateUrl: '/static/filebrowser/fb-filedetails/fb-filedetails.html',
    controller: ['$scope', '$element', '$modal', 'FilesystemService', 'FilebrowserService', function($scope,$element,$modal,FilesystemService,FilebrowserService) {
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

      self.editFile = {};
      self.selection = {};
      $scope.$watch(function() {
        return FilebrowserService.getSelection();
      }, function(newValue) {
        self.selection = newValue;
        // Create a deep copy of the selected file for editing
        self.editFile = angular.copy(newValue.selectedFile);
        if (self.editFile) {
          self.editFile.permModel = permStringToModel(self.editFile.permissions);
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
                FilebrowserService.setSelection({
                  cwd: self.selection.cwd,
                  selectedFile: self.selection.selectedFile
                });
              });
          });
      };

      self.changeGroup = function() {
        FilesystemService
          .changeGroup(self.selection.selectedFile.filepath,self.editFile.group)
          .then(function() {
            self.selection.selectedFile.group = self.editFile.group;
            FilebrowserService.setSelection({
              cwd: self.selection.cwd,
              selectedFile: self.selection.selectedFile
            });
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
            FilebrowserService.setSelection({
              cwd: self.selection.cwd,
              selectedFile: self.selection.selectedFile
            });
          });
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
            FilebrowserService.setSelection({
              cwd: self.selection.cwd,
              selectedFile: self.selection.selectedFile
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
              FilebrowserService.setSelection({
                cwd: self.selection.cwd
              });
            });
        }, function () {
          self.deleteModalInstance = null;
        });
      };

    }]
  };
}]);
