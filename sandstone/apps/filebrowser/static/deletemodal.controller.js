'use strict';

angular.module('sandstone.filebrowser')

.controller('DeleteModalInstanceCtrl', ['FilesystemService', '$modalInstance', 'file',function (FilesystemService, $modalInstance, file) {
  var self = this;
  self.file = file;
  self.delete = function () {
    $modalInstance.close(self.file);
  };
  self.cancel = function () {
    $modalInstance.dismiss('cancel');
  };
}]);
