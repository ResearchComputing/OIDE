'use strict';

angular.module('sandstone.filebrowser')

.controller('DeleteModalInstanceCtrl', ['FilesystemService', '$uibModalInstance', 'file',function (FilesystemService, $uibModalInstance, file) {
  var self = this;
  self.file = file;
  self.delete = function () {
    $uibModalInstance.close(self.file);
  };
  self.cancel = function () {
    $uibModalInstance.dismiss('cancel');
  };
}]);
