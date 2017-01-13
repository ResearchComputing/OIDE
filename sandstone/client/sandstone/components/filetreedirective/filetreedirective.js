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
        if (self.extraOnSelect) {
          self.extraOnSelect(node, selected);
        }
      };

      var loadDirectoryContents = function(node) {
        FilesystemService.getDirectoryDetails(node.filepath, {}, function(directory) {
          node.children = [];
          for (var i=0;i<directory.contents.length;i++) {
            node.children.push(directory.contents[i]);
          }
        });
      };

      var updateDirectoryContents = function(filepath) {
        for (var i=0;i<self.treeData.expanded.length;i++) {
          if (self.treeData.expanded[i].filepath === filepath) {
            loadDirectoryContents(self.treeData.expanded[i]);
            break;
          }
        }
      };

      $rootScope.$on('filesystem:file_created', function(event, data) {
        var nodePath;
        if (data.is_directory) {
          nodePath = data.filepath;
        } else {
          nodePath = data.dirpath;
        }
        updateDirectoryContents(nodePath);
      });

      $rootScope.$on('filesystem:file_deleted', function(event, data) {
        var nodePath;
        if (data.is_directory) {
          nodePath = data.filepath;
        } else {
          nodePath = data.dirpath;
        }
        updateDirectoryContents(nodePath);
      });

      $rootScope.$on('filesystem:file_deleted', function(event, data) {
        var srcNodePath,destNodePath;
        if (data.is_directory) {
          srcNodePath = data.src_path;
          destNodePath = data.dest_path;
        } else {
          srcNodePath = data.src_dirpath;
          destNodePath = data.dest_dirpath;
        }
        updateDirectoryContents(srcNodePath);
        updateDirectoryContents(destNodePath);
      });

      self.onToggle = function(node,expanded) {
        if (self.extraOnToggle) {
          self.extraOnToggle(node, expanded);
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
