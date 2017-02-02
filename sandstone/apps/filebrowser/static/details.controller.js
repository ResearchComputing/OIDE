'use strict';

angular.module('sandstone.filebrowser')

.controller('DetailsCtrl', ['$scope', 'FilebrowserService', 'FilesystemService', function($scope,FilebrowserService,FilesystemService) {
  var self = this;

  self.filesystem = {};
  $scope.$watch(function() {
    return FilebrowserService.getFilesystem();
  }, function(newValue) {
    self.filesystem = newValue;
  });

  self.breadcrumbs = [];
  $scope.$watch(function() {
    return FilebrowserService.getBreadcrumbs();
  }, function(newValue) {
    self.breadcrumbs = newValue;
  },true);

  self.changeDirectory = function(index) {
    FilebrowserService.setSelection({
      cwd: self.breadcrumbs[index]
    });
  };

  self.selection = {};
  $scope.$watch(function() {
    return FilebrowserService.getSelection();
  }, function(newValue) {
    self.selection = newValue;
  },true);

  // Directory Details
  self.openDirectory = function(file) {
    if (file.type === 'file') {
      self.selectFile(file);
    } else {
      FilebrowserService.setSelection({
        cwd: file
      });
    }
  };

  self.selectFile = function(file) {
    FilebrowserService.setSelection({
      cwd: self.selection.cwd,
      selectedFile: file
    });
  };
}])
