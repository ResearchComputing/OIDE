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

      self.getParentNode = function(node) {
          // Depth First Search to find the parent node for a given node
          var s = [];
          self.treeData.filetreeContents.forEach(function(element) {
              s.push(element);
          });
          var isFound = false;
          var parentNode = null;

          while(!isFound || s.length == 0) {
              // Pop the first element of the array
              var currentElement = s.shift();
              // Base case
              if(currentElement.filepath == node.dirname) {
                  isFound = true;
                  parentNode = currentElement;
              } else if(currentElement.type == 'dir') {
                  if(node.dirname.indexOf(currentElement.filepath) != -1) {
                      // Push children of elements on stack
                      currentElement.children.forEach(function(child) {
                          // Prepend to stack if directory
                          if(child.type == 'dir') {
                              s.unshift(child);
                          }
                      });
                  }
              }
          }
          return parentNode;
      };

      self.addNode = function(node) {
          var parentNode = self.getParentNode(node);
          if(parentNode) {
              parentNode.children.push(node);
              if(node.type == 'dir') {
                  node.children = [];
              }
          }
      };

      self.removeNode = function(node) {
          var parentNode = self.getParentNode(node);
          if(parentNode) {
              var nodeToBeRemoved = parentNode.children.filter(function(el) {
                  return el.filepath === node.filepath;
              });
              if(nodeToBeRemoved) {
                  parentNode.children.splice(parentNode.children.indexOf(nodeToBeRemoved[0]), 1);
              }
          }
      };

      self.initializeFiletree = function () {
        if(self.leafLevel == "file") {
          FilesystemService.getFiles('', self.populateTreeData);
        } else if(self.leafLevel == "dir") {
          FilesystemService.getFolders({filepath: ''}, self.populateTreeData);
        }
        $rootScope.$on('refreshFiletree', function() {
          self.updateFiletree();
        });
        $rootScope.$on('deletedFile', function(e, data, status, headers, config, node){
          self.deletedFile(data, status, headers, config, node);
        });
        $rootScope.$on('pastedFiles', function(e, newDirPath){
          self.pastedFiles(newDirPath);
        });
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
        if(index == -1) {
            // Node is not present
            return;
        }
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

      self.pastedFiles = function(newDirPath) {
        if (!self.isExpanded(newDirPath)) {
          var node = self.getNodeFromPath(newDirPath,self.treeData.filetreeContents);
          self.treeData.expandedNodes.push(node);
        }
        self.updateFiletree();
      };


      self.populatetreeContents = function(data, status, headers, config, node) {
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
              node.children.push(data[i]);
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

      // Callback for invocation to FilesystemService renameFile method
      self.fileRenamed = function(data, status, headers, config, node) {
        $rootScope.$emit('fileRenamed', node.filepath, data.result);
        self.removeNodeFromFiletree(node);
        self.updateFiletree();
        $log.debug('POST: ', data.result);
      };

      // Callback for invocation to FilesystemService deleteFile method
      self.deletedFile = function(data, status, headers, config, node) {
        // $log.debug('DELETE: ', data.result);
        var node = self.getNodeFromPath(data.filepath,self.treeData.filetreeContents);
        self.removeNodeFromFiletree(node);
        $rootScope.$emit('fileDeleted', data.filepath);
        self.updateFiletree();
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
            FilesystemService.getFolders(node, self.populatetreeContents);
          } else if(self.leafLevel == "file") {
            FilesystemService.getFiles(node, self.populateDirContents);
          }
        }
      };
      self.populateDirContents = function(data, status, headers, config, node) {
          for(var i = 0; i < data.length; i++) {
              self.addNode(data[i]);
          }
      };
    }
  ]};
}]);
