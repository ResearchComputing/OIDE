'use strict';

angular.module('sandstone.filebrowser')

.controller('FbFiletreeCtrl', ['$scope', function($scope) {
  var self = this;
  self.treeData = {
    contents: [],
    selected: [],
    expanded: []
  };
  self.filterComparator = true;
  self.filterExpression = {type: '!file'};
}]);
