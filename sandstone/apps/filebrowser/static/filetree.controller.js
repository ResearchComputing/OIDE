'use strict';

angular.module('sandstone.filebrowser')

.controller('FbFiletreeCtrl', ['$scope', 'FilebrowserService', 'FilesystemService', function($scope, FilebrowserService, FilesystemService) {
  var self = this;
  self.treeData = FilebrowserService.treeData;
  self.filterComparator = true;
  self.filterExpression = {type: '!file'};

  self.treeOnSelect = function(node, selected) {
    if (!selected) {
      // Do not allow deselect
      self.treeData.selected = [node];
    } else {
      // A new directory was selected
      FilebrowserService.setSelection({
        cwd: node
      });
    }
  };

  self.selection = {};
  $scope.$watch(function() {
    return FilebrowserService.getSelection();
  }, function(newValue) {
    self.selection = newValue;
  });

}]);
