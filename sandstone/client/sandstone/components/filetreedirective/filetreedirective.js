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
      FilesystemService.getFilesystemDetails(function(filesystem) {
        for (var i=0;i<filesystem.volumes.length;i++) {
          filesystem.volumes[i].name = filesystem.volumes[i].filepath;
          self.treeData.contents.push(filesystem.volumes[i]);
        }
      });

      // Options
      self.options = {
        multiSelection: false,
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
        if (self.extraOnSelect) {
          self.extraOnSelect({node: node, selected: selected});
        }
      };

      self.loadDirectoryContents = function(node) {
        FilesystemService.getDirectoryDetails(node.filepath, {}, function(directory) {
          node.children = [];
          for (var i=0;i<directory.contents.length;i++) {
            node.children.push(directory.contents[i]);
          }
        });
      };

      self.updateDirectoryContents = function(filepath) {
        var node, nodeNormPath;
        var normPath = FilesystemService.normalize(filepath);
        for (var i=0;i<self.treeData.expanded.length;i++) {
          node = self.treeData.expanded[i];
          nodeNormPath = FilesystemService.normalize(node.filepath);
          if (nodeNormPath === normPath) {
            self.loadDirectoryContents(node);
            break;
          }
        }
      };

      $rootScope.$on('filesystem:file_created', function(event, data) {
        updateDirectoryContents(data.dirpath);
      });

      $rootScope.$on('filesystem:file_deleted', function(event, data) {
        updateDirectoryContents(data.dirpath);
      });

      $rootScope.$on('filesystem:file_moved', function(event, data) {
        updateDirectoryContents(data.src_dirpath);
        updateDirectoryContents(data.dest_dirpath);
      });

      self.onToggle = function(node,expanded) {
        if (self.extraOnToggle) {
          self.extraOnToggle({node: node, expanded: expanded});
        }

        if (!self.isExpanded(node.filepath)) {
          FilesystemService.deleteFilewatcher(node.filepath, function() {});
          return;
        }

        loadDirectoryContents(node);
        FilesystemService.createFilewatcher(node.filepath, function() {});
      };
    }
  ]};
}]);
