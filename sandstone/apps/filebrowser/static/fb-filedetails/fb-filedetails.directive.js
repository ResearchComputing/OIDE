'use strict';

angular.module('sandstone.filebrowser')

.directive('fbFileDetails', [function() {
  return {
    restrict: 'A',
    scope: {},
    templateUrl: '/static/filebrowser/fb-filedetails/fb-filedetails.html',
    controller: ['$scope', '$element', 'FilesystemService', 'FilebrowserService', function($scope,$element,FilesystemService,FilebrowserService) {
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
    }]
  };
}]);
