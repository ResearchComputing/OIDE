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
    controller: ['$scope', '$document', '$element', '$timeout', 'FilesystemService', '$rootScope', 'BroadcastService', function($scope, $document, $element, $timeout, FilesystemService, $rootScope, BroadcastService) {
      var self = $scope;

      self.treeData = {
        filetreeContents: [
          // { "type": "dir", "filepath": "/tmp/", "filename" : "tmp", "children" : []}
        ],
        selectedNodes: []
      };
      self.selectionDesc = {
        noSelections: true,
        multipleSelections: false,
        dirSelected: false
      };
      self.clipboard = [];
      // self.leafLevel = '';

      self.populateTreeData = function(data, status, headers, config) {
        for (var i=0;i<data.length;i++) {
          data[i].children = [];
        }
        self.treeData.filetreeContents = data;
      };

      self.initializeFiletree = function () {
        $rootScope.$on('filetree:root_dirs', function(e, data) {
            self.$apply(function(){
                self.populateTreeData(data.root_dirs);
            });
        });
        var message = {
            key: 'filetree:init',
            data: {}
        };
        BroadcastService.sendMessage(message);
        $rootScope.$on('refreshFiletree', function() {
          self.updateFiletree();
        });
        $rootScope.$on('filetree:got_contents', function(e, data) {
            self.$apply(function(){
                self.populatetreeContents(data.contents, data.node);
            });
        });
        $rootScope.$on('filetree:created_file', function(e, data) {
            self.updateFiletree();
        });
        $rootScope.$on('filetree:created_new_dir', function(e, data) {
            self.updateFiletree();
        });
        $rootScope.$on('filetree:files_deleted', function(e, data) {
            self.updateFiletree();
        });
        $rootScope.$on('filetree:file_renamed', function(e, data) {
            self.updateFiletree();
        });
        $rootScope.$on('filetree:files_pasted', function(e, data) {
            self.updateFiletree();
        });
        $rootScope.$on('filetree:next_untitled_dir', function(e, data) {
            var message = {
                key: 'filetree:create_new_dir',
                data: {
                    dirpath: data.dirpath
                }
            };
            BroadcastService.sendMessage(message);
        });
        $rootScope.$on('filetree:next_untitled_file', function(e, data) {
            var message = {
                key: 'filetree:create_new_file',
                data: {
                    'filepath': data.filepath
                }
            };
            BroadcastService.sendMessage(message);
        });
        $rootScope.$on('filetree:created_file', function(e, data) {
            self.updateFiletree();
        });
        $rootScope.$on('filetree:deleted_file', function(e, data) {
            self.updateFiletree();
        });
      };
      self.initializeFiletree();
      self.getNodeFromPath = function (filepath, nodeList) {
        var matchedNode;
        var folderName;
        var strippedFilepath;
        for (var i=0;i<nodeList.length;i++) {
          folderName = nodeList[i].filepath;
          strippedFilepath = filepath;
          if(filepath.charAt(filepath.length - 1) == '/') {
            strippedFilepath = filepath.substr(0, filepath.length - 1);
          }
          if(nodeList[i].type == 'dir' && folderName.charAt(folderName.length - 1) == '/') {
            folderName = folderName.substr(0, folderName.length - 1);
          }
          if (strippedFilepath.lastIndexOf(folderName,0) === 0) {
            if (strippedFilepath === folderName) {
              return nodeList[i];
            } else if (nodeList[i].type === 'dir') {
              return self.getNodeFromPath(filepath, nodeList[i].children);
            }
          }
        }
      };
      self.getFilepathsForDir = function (dirpath) {
        var children = self.getNodeFromPath(dirpath,self.treeData.filetreeContents).children;
        var filepaths = [];
        for (var i=0;i<children.length;i++) {
          filepaths.push(children[i].filepath);
        }
        return filepaths;
      };
      self.removeNodeFromFiletree = function (node){
        if(!node) {
          return;
        }
        var index;
        index = self.treeData.selectedNodes.indexOf(node);
        if (index >= 0) {
          self.treeData.selectedNodes.splice(index, 1);
        }
        index = self.treeData.expandedNodes.indexOf(node);
        if (index >= 0) {
          self.treeData.expandedNodes.splice(index, 1);
        }
        var filepath, dirpath, parentNode;
        if (node.filepath.slice(-1) === '/') {
          filepath = node.filepath.substring(0,node.filepath.length-1);
        } else {
          filepath = node.filepath;
        }
        dirpath = filepath.substring(0,filepath.lastIndexOf('/')+1);
        parentNode = self.getNodeFromPath(dirpath,self.treeData.filetreeContents);
        index = parentNode.children.indexOf(node);
        parentNode.children.splice(index,1);
        self.describeSelection();
      };
      self.isExpanded = function (filepath) {
        for (var i=0;i<self.treeData.expandedNodes.length;i++) {
          if (self.treeData.expandedNodes[i].filepath === filepath) {
            return true;
          }
        }
        return false;
      };

      self.isDisplayed = function (filepath) {
        for (var i=0;i<self.treeData.filetreeContents.length;i++) {
          if (self.treeData.filetreeContents[i].filepath === filepath) {
            return true;
          }
        }
        return false;
      };

      self.populatetreeContents = function(data, node) {
          var existingNode = self.getNodeFromPath(node.filepath, self.treeData.filetreeContents);
          var matchedNode;
          var currContents = self.getFilepathsForDir(node.filepath);
          for (var i=0;i<data.length;i++) {
            if (currContents.indexOf(data[i].filepath) >= 0) {
              matchedNode = self.getNodeFromPath(data[i].filepath,self.treeData.filetreeContents);
              if ((data[i].type === 'dir') && self.isExpanded(data[i].filepath)) {
                self.getDirContents(matchedNode);
              }
              currContents.splice(currContents.indexOf(data[i].filepath), 1);
            } else {
              data[i].children = [];
              existingNode.children.push(data[i]);
            }
          }
          var index;
          for (var i=0;i<currContents.length;i++) {
            matchedNode = self.getNodeFromPath(currContents[i],self.treeData.filetreeContents);
            self.removeNodeFromFiletree(matchedNode);
          }
        };

      self.updateFiletree = function () {
        var filepath, node;
        for (var i=0;i<self.treeData.expandedNodes.length;i++) {
          self.getDirContents(self.treeData.expandedNodes[i], true);
        }
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
          return node.type !== 'dir';
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
          if (self.treeData.selectedNodes[i].type==='dir') {
            dirSelected = true;
          }
        }
        self.selectionDesc.dirSelected = dirSelected;
      };
      self.getDirContents = function (node, expanded) {
        if(expanded) {
          if(self.leafLevel == "dir") {
            var message = {
                key: 'filetree:expanded',
                data: {
                    node: node,
                    dirs: true,
                }
            };
            BroadcastService.sendMessage(message);
          } else if(self.leafLevel == "file") {
            var message = {
                key: 'filetree:expanded',
                data: {
                    node: node,
                    dirs: false
                }
            };
            BroadcastService.sendMessage(message);
          }
        }
      };
      self.showSelected = function(node, selected) {
        console.log(node);
        console.log(selected);
      };
    }
  ]};
}]);
