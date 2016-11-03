angular.module('sandstone.filetreedirective', [])

.directive('sandstoneFiletree', [function(){
  return {
    restrict: 'A',
    scope: {
      extraOptions: '=options',
      extraOnSelect: '&onSelect',
      extraOnToggle: '&onToggle',
      treeData: '='
    },
    templateUrl: '/static/core/components/filetreedirective/templates/filetree.html',
    controller: ['$scope', '$element', '$rootScope', 'FilesystemService', function($scope, $element, $rootScope, FilesystemService) {
      var self = $scope;
      if (!self.treeData) {
        self.treeData = {
          contents: [],
          expanded: [],
          selected: []
        };
        FilesystemService.getFilesystemDetails(function(filesystem) {
          for (var i=0;i<filesystem.volumes.length;i++) {
            self.treeData.contents.push(filesystem.volumes[i]);
          }
        });
      }

      // Options
      var options = {
        multiSelection: true,
        isLeaf: function(node) {
          return node.type === 'file';
        },
        injectClasses: {
          iExpanded: "filetree-icon fa fa-caret-down",
          iCollapsed: "filetree-icon fa fa-caret-right",
          iLeaf: "filetree-icon fa"
        }
      };

      self.$watch('extraOptions', function(oldValue,newValue) {
        if (self.extraOptions) {
          angular.extend(self.options,self.extraOptions);
        }
      }, true);

      // Tree contents
      self.isExpanded = function (filepath) {
        for (var i=0;i<self.treeData.expanded.length;i++) {
          if (self.treeData.expanded[i].filepath === filepath) {
            return true;
          }
        }
        return false;
      };

      self.onSelect = function(node,selected) {
        if (extraOnSelect) {
          extraOnSelect(node, selected);
        }
      };

      self.onToggle = function(node,expanded) {
        if (extraOnToggle) {
          extraOnToggle(node, expanded);
        }

        if (!self.isExpanded(node.filepath)) {
          return;
        }

        FilesystemService.getDirectoryDetails(node.filepath, {}, function(directory) {
          for (var i=0;i<directory.contents.length;i++) {
            node.children.push(directory.contents[i]);
          }
        });
      };
    }
  ]};
}]);
