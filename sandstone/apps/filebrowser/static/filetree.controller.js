'use strict';

angular.module('sandstone.filebrowser')

.controller('FbFiletreeCtrl', ['$scope', 'FilebrowserService', function($scope, FilebrowserService) {
  var self = this;
  self.treeData = FilebrowserService.treeData;
  self.filterComparator = true;
  self.filterExpression = {type: '!file'};
}]);
