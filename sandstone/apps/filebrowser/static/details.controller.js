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
  var setBreadcrumbs = function() {
    if (self.selection.cwd) {
      var cmps = FilesystemService.split(self.selection.cwd.filepath);
      self.breadcrumbs = [];
      for (var i=0;i<cmps.length;i++) {
        if (cmps[i] !== '') {
          self.breadcrumbs.push(cmps[i]);
        }
      }
    }
  };

  self.changeDirectory = function(index) {
    var newPathCmps = self.breadcrumbs.slice(0,index+1);
    newPathCmps[0] = '/' + newPathCmps[0];
    var newPath = FilesystemService.join.apply(this,newPathCmps);
    var volume = FilesystemService.normalize(self.selection.volume.filepath);
    if (newPath.length < volume.length) {
      volume = FilebrowserService.getVolumeFromPath(newPath);
      if (!volume) {
        FilebrowserService.setSelection({
          cwd: self.selection.volume
        });
        return;
      }
    }

    FilebrowserService.setSelection({
      cwd: newPath
    });
  };

  self.selection = {};
  $scope.$watch(function() {
    return FilebrowserService.getSelection();
  }, function(newValue) {
    self.selection = newValue;
    setBreadcrumbs();
  },true);

}])
