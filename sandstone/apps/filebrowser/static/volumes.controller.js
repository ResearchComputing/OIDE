'use strict';

angular.module('sandstone.filebrowser')

.controller('VolumesCtrl', ['$scope', 'FilebrowserService', 'FilesystemService', function($scope, FilebrowserService, FilesystemService) {
  var self = this;

  self.filesystem = {};
  $scope.$watch(function() {
    return FilebrowserService.getFilesystem();
  }, function(newValue) {
    self.filesystem = newValue;
  });

  self.changeVolume = function(volume) {
    FilebrowserService.setSelection({
      cwd: volume
    });
  };

  self.selection = {};
  $scope.$watch(function() {
    return FilebrowserService.getSelection();
  }, function(newValue) {
    self.selection = newValue;
  });

}]);
