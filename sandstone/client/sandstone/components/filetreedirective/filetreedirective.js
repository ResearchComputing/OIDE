angular.module('sandstone.filetreedirective', [])

.directive('sandstoneFiletree', [function(){
  return {
    restrict: 'A',
    scope: {
      treeData: '=',
      selectionDesc: '=',
      leafLevel: '@'
    },
    templateUrl: '/static/core/components/filetreedirective/templates/filetree.html',
    controller: ['$scope', '$document', '$element', '$timeout', 'FilesystemService', '$rootScope', function($scope, $document, $element, $timeout, FilesystemService, $rootScope) {
      var self = $scope;

      self.treeData = {
        filetreeContents: [
          // { "type": "dir", "filepath": "/tmp/", "filename" : "tmp", "children" : []}
        ],
        selectedNodes: []
      };

      self.clipboard = [];
      // self.leafLevel = '';

      self.populateTreeData = function(data, status, headers, config) {
        for (var i=0;i<data.length;i++) {
          data[i].children = [];
        }
        self.treeData.filetreeContents = data;
      };

      self.gotVolumes = function(data) {
          data.forEach(function(element) {
              element.children = [];
          });
          self.treeData.filetreeContents = data;
      };

      self.initializeFiletree = function () {
        // if(self.leafLevel == "file") {
        //   FilesystemService.getFiles('', self.populateTreeData);
        // } else if(self.leafLevel == "dir") {
        //   FilesystemService.getFolders({filepath: ''}, self.populateTreeData);
        // }
        FilesystemService.getVolumes(self.gotVolumes);
        $rootScope.$on('filetree:created_file', function(e, data) {
            self.updateFiletree();
        });
        $rootScope.$on('filetree:deleted_file', function(e, data) {
            self.updateFiletree();
        });
        $rootScope.$on('filetree:moved_file', function(e, data) {
            self.updateFiletree();
        });
      };
      self.initializeFiletree();
      self.isExpanded = function (filepath) {
        for (var i=0;i<self.treeData.expandedNodes.length;i++) {
          if (self.treeData.expandedNodes[i].filepath === filepath) {
            return true;
          }
        }
        return false;
      };

      self.updateFiletree = function () {
        var filepath, node;
        for (var i=0;i<self.treeData.expandedNodes.length;i++) {
          self.getDirContents(self.treeData.expandedNodes[i], true);
        }
      };

      // Callback for getting a new untitled directory name from FilesystemService
      self.gotNewUntitledDir = function(data, status, headers, config) {
        $log.debug('GET: ', data);
        var newDirPath = data.result;
        FilesystemService.createNewDir(newDirPath, self.createdNewDir);
      };

      // Callback for creating new directory
      self.createdNewDir = function(data, status, headers, config) {
        $log.debug('POST: ', data);
        self.updateFiletree();
      };

      self.multiSelection = false;
      $document.on('keydown', (function (e) {
        if (e.keyCode === 17) {
          self.multiSelection = true;
        }
      }));
      $document.on('keyup', (function (e) {
        if (e.keyCode === 17) {
          self.multiSelection = false;
        }
      }));
      self.treeOptions = {
        multiSelection: true,
        isLeaf: function(node) {
          return node.type !== 'directory' && node.type !== 'volume';
        },
        injectClasses: {
          iExpanded: "filetree-icon fa fa-caret-down",
          iCollapsed: "filetree-icon fa fa-caret-right",
          iLeaf: "filetree-icon fa"
        }
      };
      self.describeSelection = function (node, selected) {
        if (self.multiSelection === false) {
          if (selected) {
            self.treeData.selectedNodes = [node];
          } else {
            self.treeData.selectedNodes = [];
          }
        }
        self.selectionDesc.multipleSelections = self.treeData.selectedNodes.length > 1;
        self.selectionDesc.noSelections = self.treeData.selectedNodes.length === 0;
        var dirSelected = false;
        for (var i in self.treeData.selectedNodes) {
          if (self.treeData.selectedNodes[i].type==='directory') {
            dirSelected = true;
          }
        }
        self.selectionDesc.dirSelected = dirSelected;
      };

      self.getParentNode = function(node) {
          var parentNode = self.expandedNodes.filter(function(currentNode) {
              return currentNode.filepath === node.dirname;
          });
          if(parentNode && parentNode.length > 0) {
              return parentNode[0];
          }
          return null;
      };

      self.addNode = function(node) {
          var parentNode = self.getParentNode(node);
          if(parentNode) {
              // Find the position where the node should be inserted in alphabetical order
              var pos = parentNode.children.findIndex(function(element, index) {
                  return (node.type === element.type && node.filepath > element.filepath);
              });

              if(pos === -1) {
                  if(node.type == 'file') {
                      // Node is a file, and there are no files
                      // push to end
                      parentNode.children.push(node);
                  } else {
                      // Node is a directory, and there are no directories
                      // Add to beginning of children array
                      parentNode.children.unshift(node);
                  }
              } else {
                  // Insert node in the right position
                  parentNode.children.splice(pos, 0, node);
              }
          }
      };

      var removeNode = function(node) {
          var parentNode = self.getParentNode(node);
          if(parentNode) {
              var pos = parentNode.children.indexOf(node);
              if(pos) {
                  parentNode.children.splice(pos, 1);
              }
          }
      };

      self.populateDirData = function(data, status, headers, config, node) {
          node.children = data.contents;
      };

      self.getDirContents = function (node, expanded) {
        if(expanded) {
          if(self.leafLevel == "dir") {
            FilesystemService.getFolders(node, self.populateDirData);
          } else if(self.leafLevel == "file") {
            FilesystemService.getFiles(node, self.populateDirData);
          }
        }
      };
    }
  ]};
}]);
