'use strict';

angular.module('sandstone.filebrowser')

.controller('DetailsCtrl', ['$scope', '$uibModal', 'FilebrowserService', 'FilesystemService', 'AlertService', function($scope,$uibModal,FilebrowserService,FilesystemService,AlertService) {
  var self = this;

  // Breadcrumbs
  self.breadcrumbs = [];

  var setBreadcrumbs = function() {
    var volPath;
    if (!self.selection.volume) {
      // No volume selected yet
      self.breadcrumbs = [];
    } else if(!self.selection.cwd) {
      // Only a volume is selected
      volPath = FilesystemService.normalize(self.selection.volume.filepath);
      self.breadcrumbs = [self.selection.volume.filepath];
    } else {
      var crumbs = [];
      volPath = FilesystemService.normalize(self.selection.volume.filepath);
      var cwdPath = FilesystemService.normalize(self.selection.cwd.filepath);
      var crumbPath = FilesystemService.normalize(cwdPath.replace(volPath,''));
      crumbs.push(volPath);
      var crumbCmps = FilesystemService.split(crumbPath).slice(1);
      for (var i=0; i<crumbCmps.length; i++) {
        crumbs.push(crumbCmps[i]);
      }
      self.breadcrumbs = crumbs;
    }
  };

  self.selectCrumb = function(index) {
    if(index===0) {
      self.changeDirectory(self.selection.volume.filepath);
    } else {
      var pathCmps = self.breadcrumbs.slice(0,index+1);
      var navPath = FilesystemService.join.apply(this,pathCmps);
      navPath = FilesystemService.normalize(navPath);
      self.changeDirectory(navPath);
    }
  };

  self.selection = {};
  $scope.$watch(function() {
    return FilebrowserService.getSelection();
  }, function(newValue) {
    self.selection = newValue;
    setBreadcrumbs();
  },true);

  // Directory Details
  self.openDirectory = function(file) {
    if (file.type === 'file') {
      self.selectFile(file);
    } else {
      FilebrowserService.setSelectedFile();
      FilebrowserService.setCwd(file.filepath);
    }
  };

  self.selectFile = function(file) {
    FilebrowserService.setSelectedFile(file);
  };

  self.changeDirectory = function(filepath) {
    FilebrowserService.setSelectedFile();
    FilebrowserService.setCwd(filepath);
  };

  self.create = function(type) {
    self.createModalInstance = $uibModal.open({
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

    self.createModalInstance.result.then(function (newFileName) {
      var newPath = FilesystemService.join(self.selection.cwd.filepath,newFileName);

      var createReq;
      var setSelection = function(filepath) {
        FilebrowserService.setSelectedFile(self.selection.selectedFile);
      };
      var failedToCreate = function(data) {
        AlertService.addAlert({
          type: 'danger',
          message: 'Failed to create ' + newPath
        });
      };
      if (type === 'file') {
        createReq = FilesystemService.createFile(newPath);
        createReq.then(setSelection,failedToCreate);
      } else {
        createReq = FilesystemService.createDirectory(newPath);
        createReq.then(setSelection,failedToCreate);
      }
    });
  };

  self.upload = function() {
    var modalInstance = $uibModal.open({
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
      FilebrowserService.setCwd(self.selection.cwd);
    });
  };

}]);
