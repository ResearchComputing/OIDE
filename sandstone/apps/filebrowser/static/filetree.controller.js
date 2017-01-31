'use strict';

angular.module('sandstone.filebrowser')

.controller('FiletreeCtrl', ['$scope', function($scope) {
  var self = this;
  self.treeData = {
    contents: [],
    selected: [],
    expanded: []
  };
  self.treeOptions = {
    multiSelection: true
  };
  // Workaround since toggling multiSelection in Filetree creates a
  // condition where treeData.selected becomes disused.
  self.treeOnSelect = function(node,selected) {
    if (selected) {
      self.treeData.selected = [node];
    } else {
      self.treeData.selected = [];
    }
  };

}]);
