'use strict';

angular.module('sandstone.filebrowser')

.controller('MoveModalInstanceCtrl', ['FilesystemService', '$modalInstance', 'file',function (FilesystemService, $modalInstance, file) {
  var self = this;
  self.treeData = {
    contents: [],
    selected: [],
    expanded: []
  };

  self.filetreeOnSelect = function(node,selected) {
    if (selected) {
      if ( (node.type === 'directory') || (node.type === 'volume') ) {
        self.newFile.dirpath = node.filepath;
      } else {
        self.newFile.dirpath = node.dirpath;
        self.newFile.name = node.name;
      }
    }
  };

  self.newFile = {
    name: file.name,
    dirpath: file.dirpath
  };

  self.validFilepath = function() {
    var valid = (self.newFile.name.length && self.newFile.dirpath.length);
    valid = valid && (FilesystemService.isAbsolute(self.newFile.dirpath));
    return valid;
  };

  self.move = function () {
    var filepath;
    var dirpath = FilesystemService.normalize(self.newFile.dirpath);

    filepath = FilesystemService.join(dirpath,self.newFile.name);
    $modalInstance.close(filepath);
  };

  self.cancel = function () {
    $modalInstance.dismiss('cancel');
  };
}]);
