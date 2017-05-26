'use strict';

angular.module('sandstone.filebrowser')

.controller('CreateModalInstanceCtrl', function ($uibModalInstance, action) {
  var self = this;
  self.type = action.type;
  self.baseDirectory = action.baseDirectory;
  if (action.hasOwnProperty('filename')) {
    self.newFileName = action.filename;
  } else {
    self.newFileName = 'Untitled';
  }

  self.create = function () {
    $uibModalInstance.close(self.newFileName);
  };

  self.cancel = function () {
    $uibModalInstance.dismiss('cancel');
  };
});
