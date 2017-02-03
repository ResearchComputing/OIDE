'use strict';

angular.module('sandstone.filebrowser')

.controller('DetailsCtrl', ['$scope', '$modal', 'FilebrowserService', 'FilesystemService', function($scope,$modal,FilebrowserService,FilesystemService) {
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

  self.create = function(type) {
    var createModalInstance = $modal.open({
      templateUrl: '/static/filebrowser/templates/create-modal.html',
      backdrop: 'static',
      keyboard: false,
      controller: 'CreateModalInstanceCtrl as ctrl',
      resolve: {
        action: function () {
          return {
            type: type,
            baseDirectory: self.selection.cwd,
            filename: 'Untitled'
          };
        }
      }
    });

    createModalInstance.result.then(function (newFileName) {
      var newPath = FilesystemService.join(self.selection.cwd.filepath,newFileName);

      var createReq;
      var setSelection = function(filepath) {
        FilebrowserService.setSelection({
          cwd: self.selection.cwd,
          selectedFile: self.selection.selectedFile
        });
      };
      if (type === 'file') {
        createReq = FilesystemService.createFile(newPath);
        createReq.then(setSelection);
      } else {
        createReq = FilesystemService.createDirectory(newPath);
        createReq.then(setSelection);
      }
    });
  };

  self.upload = function() {
    var modalInstance = $modal.open({
      templateUrl: '/static/filebrowser/templates/upload-modal.html',
      controller: 'UploadModalInstanceCtrl as ctrl',
      backdrop: 'static',
      size: 'lg',
      resolve: {
        directory: function () {
          return self.selection.cwd;
        }
      }
    });

    modalInstance.result.then(function() {
      FilebrowserService.setSelection({
        cwd: self.selection.cwd
      });
    });
  };

}]);
