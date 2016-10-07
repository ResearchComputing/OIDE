describe('sandstone.filetree', function() {
    var $compile;
    var scope;
    var element;
    var httpBackend;
    var rootScope;
    var filesystemservice;
    var isolateScope;
    var dirs = [{
          "filepath": "/home/user/dir1",
          "filename": "dir1",
          "dirname": '/home/user',
          "group": "saurabh",
          "is_accessible": true,
          "perm": "-rw-rw-r--",
          "perm_string": "664",
          "size": "4.0 KiB",
          "type": "dir",
          "children": []
        }, {
          "filepath": "/home/user/dir2",
          "filename": "dir2",
          "dirname": '/home/user',
          "group": "root",
          "is_accessible": false,
          "perm": "-rw-r--r--",
          "perm_string": "644",
          "size": "4.0 KiB",
          "type": "dir",
          "children": []
        },
        {
          "filepath": "/home/user/dir3",
          "filename": "dir3",
          "dirname": '/home/user',
          "group": "saurabh",
          "is_accessible": true,
          "perm": "-rw-rw-r--",
          "perm_string": "664",
          "size": "4.0 KiB",
          "type": "dir",
          "children": []
        },
        {
          "filepath": "/home/user/dir4",
          "filename": "dir4",
          "dirname": '/home/user',
          "group": "saurabh",
          "is_accessible": true,
          "perm": "-rw-rw-r--",
          "perm_string": "664",
          "size": "4.0 KiB",
          "type": "dir",
          "children": []
        }];

      var rootDirs = [
          {
              'type': 'dir',
              'filename': 'user',
              'filepath': '/home/user',
              'dirname': '/home'
          },
          {
              'type': 'dir',
              'filename': 'tmp',
              'filepath': '/tmp',
              'dirname': '/tmp'
          }
      ];

      var files = [{
            "filepath": "/home/user/dir1",
            "filename": "dir1",
            "dirname": '/home/user',
            "group": "saurabh",
            "is_accessible": true,
            "perm": "-rw-rw-r--",
            "perm_string": "664",
            "size": "4.0 KiB",
            "type": "dir"
          }, {
            "filepath": "/home/user/dir2",
            "filename": "dir2",
            "dirname": '/home/user',
            "group": "root",
            "is_accessible": false,
            "perm": "-rw-r--r--",
            "perm_string": "644",
            "size": "4.0 KiB",
            "type": "dir"
          },
          {
            "filepath": "/home/user/file1",
            "filename": "file1",
            "dirname": '/home/user',
            "group": "root",
            "is_accessible": false,
            "perm": "-rw-r--r--",
            "perm_string": "644",
            "size": "4.0 KiB",
            "type": "file"
          }];

      filesystemService = {
          getFolders: function(node, callback) {
              if(node.filepath == '') {
                  callback(rootDirs);
              } else {
                  callback(dirs, null, null, null, node);
              }
          },
          getFiles: function(node, callback) {
              // return files;
              if(node == '') {
                  callback(rootDirs);
              } else {
                  callback(files, null, null, null, node);
              }
          },
          createdNewDir: function() {
              // Do something here
          }
      };
      beforeEach(module('sandstone'));
      beforeEach(module('sandstone.templates'));
      beforeEach(module('sandstone.filetreedirective'));

      describe('controller', function(){
        beforeEach(module(function($provide) {
            $provide.value('FilesystemService', filesystemService);
        }));
        beforeEach(inject(function(_$rootScope_, _$compile_, _$httpBackend_){
            $compile = _$compile_;
            scope = _$rootScope_.$new();
            rootScope = _$rootScope_;
            httpBackend = _$httpBackend_;

            httpBackend.whenGET('/filebrowser/filetree/a/dir').respond(function(){
                return [200, dirs];
            });
            scope.$apply();
        }));
        beforeEach(function() {
              scope.sd = {
                  noSelections: true,
                  multipleSelections: false,
                  dirSelection: false
              };
              var el = angular.element('<div sandstone-filetree tree-data="ctrl.treeData" leaf-level="file" selection-desc="sd"></div>');
              element = $compile(el)(scope);
              scope.$digest();

              // Get isolate scope
              isolateScope = element.isolateScope();
          });
        it('initializeFiletree', function(){
            // Create spies
            spyOn(isolateScope, 'updateFiletree');
            spyOn(isolateScope, 'deletedFile');
            spyOn(isolateScope, 'pastedFiles');

            expect(isolateScope.leafLevel).toBe("file");
            expect(isolateScope.selectionDesc.noSelections).toBe(true);
            expect(isolateScope.selectionDesc.multipleSelections).not.toBe(true);
            expect(isolateScope.selectionDesc.dirSelected).not.toBe(true);
            expect(isolateScope.treeData.filetreeContents.length).toBe(2);
            // Refresh
            rootScope.$emit('refreshFiletree');
            expect(isolateScope.updateFiletree).toHaveBeenCalled();
            // Deleted File
            rootScope.$emit('deletedFile', dirs[0]);
            expect(isolateScope.deletedFile).toHaveBeenCalled();
            // Pasted File
            rootScope.$emit('pastedFiles', dirs[0].filepath);
            expect(isolateScope.pastedFiles).toHaveBeenCalled();

            // leafLevel=dir
            isolateScope.leafLevel = 'dir';
            isolateScope.initializeFiletree();
            expect(isolateScope.treeData.filetreeContents.length).toBe(2);
        });

        it('getDirContents', function(){
            isolateScope.describeSelection(isolateScope.treeData.filetreeContents[0], true);
            isolateScope.getDirContents(isolateScope.treeData.filetreeContents[0], true);
            // First directory should have 3 files
            expect(isolateScope.treeData.filetreeContents[0].children.length).toBe(3);

            // leafLevel=dir
            isolateScope.leafLevel = 'dir';
            isolateScope.getDirContents(isolateScope.treeData.filetreeContents[0], true);
            // First directory should have 4 files
            expect(isolateScope.treeData.filetreeContents[0].children.length).toBe(4);
        });

        it('getNodeFromPath', function(){
            // Get contents for first node
            isolateScope.getDirContents(isolateScope.treeData.filetreeContents[0], true);
            var node = isolateScope.getNodeFromPath('/home/saurabh/dir111', isolateScope.treeData.filetreeContents);
            expect(node).not.toBeDefined();

            var node = isolateScope.getNodeFromPath('/home/user/dir1', isolateScope.treeData.filetreeContents);
            // Expect node parameters to match
            expect(node.filepath).toBe('/home/user/dir1');
            expect(node.filename).toBe('dir1');
            expect(node.group).toBe('saurabh');
            expect(node.is_accessible).toBe(true);
            expect(node.perm).toBe('-rw-rw-r--');
            expect(node.perm_string).toBe('664');
            expect(node.size).toBe('4.0 KiB');
        });

        it('getFilepathsForDir', function(){
            httpBackend.expectGET(/\/filebrowser\/filetree\/a\/dir\?dirpath=.*/).respond(function(){
            return [200, files];
            });
            isolateScope.getDirContents(isolateScope.treeData.filetreeContents[0], true);
            //   httpBackend.flush();
            var node = isolateScope.getNodeFromPath(isolateScope.treeData.filetreeContents[0].filepath, isolateScope.treeData.filetreeContents);
            expect(node.children.length).toBe(3);
        });

        it('removeNodeFromFiletree', function(){
            // Get contents of first node
            isolateScope.getDirContents(isolateScope.treeData.filetreeContents[0], true);
            // Remove the second node
            var node = isolateScope.treeData.filetreeContents[0].children[1];
            isolateScope.removeNodeFromFiletree(node);
            expect(isolateScope.treeData.filetreeContents[0].children.length).toBe(2);

            // Try removing same node again
            isolateScope.removeNodeFromFiletree(node);
            expect(isolateScope.treeData.filetreeContents[0].children.length).toBe(2);
        });

        it('isExpanded', function(){
            isolateScope.treeData.expandedNodes = [dirs[0]];
            expect(isolateScope.isExpanded(dirs[0].filepath)).toBe(true);
            expect(isolateScope.isExpanded(dirs[1].filepath)).not.toBe(true);
        });

        it('describeSelection', function(){
            var node = isolateScope.treeData.filetreeContents[0];
            isolateScope.describeSelection(node, true);
            expect(isolateScope.treeData.selectedNodes.length).toBe(1);
            isolateScope.describeSelection(node, false);
            expect(isolateScope.treeData.selectedNodes.length).toBe(0);
        });

        it('$rootScope.$on: filtree:created_file', function() {
            spyOn(isolateScope, 'updateFiletree');
            rootScope.$emit('filetree:created_file', {
                filepath: '/tmp/some-file.txt'
            });
            expect(isolateScope.updateFiletree).toHaveBeenCalled();
        });
        it('$rootScope.$on: filtree:deleted_file', function() {
            spyOn(isolateScope, 'updateFiletree');
            rootScope.$emit('filetree:deleted_file', {
                filepath: '/tmp/some-file.txt'
            });
            expect(isolateScope.updateFiletree).toHaveBeenCalled();
        });
        it('$rootScope.$on: filetree:moved_file', function() {
            spyOn(isolateScope, 'updateFiletree');
            rootScope.$emit('filetree:moved_file', {
                src_filepath: '/home/user/somefile',
                dest_filepath: '/home/user/some_new_file'
            });
            expect(isolateScope.updateFiletree).toHaveBeenCalled();
        });
        it('addNode', function() {
            isolateScope.describeSelection(isolateScope.treeData.filetreeContents[0], true);
            isolateScope.getDirContents(isolateScope.treeData.filetreeContents[0], true);

            var node_1 = {
                'filepath': '/home/user/dir1/file1',
                'filename': 'file1',
                'dirname': '/home/user/dir1',
                'type': 'file'
            };
            var node_2 = {
                'filepath': '/home/user/dir1/file2',
                'filename': 'file2',
                'dirname': '/home/user/dir1',
                'type': 'file'
            };

            isolateScope.addNode(node_1);
            isolateScope.addNode(node_2);
            expect(isolateScope.treeData.filetreeContents[0].children[0].children.length).toBe(2);

        });
        it('removeNode', function() {
            isolateScope.describeSelection(isolateScope.treeData.filetreeContents[0], true);
            isolateScope.getDirContents(isolateScope.treeData.filetreeContents[0], true);

            var node_1 = {
                'filepath': '/home/user/dir1',
                'filename': 'dir1',
                'dirname': '/home/user',
                'type': 'dir'
            };
            var node_2 = {
                'filepath': '/home/user/file1',
                'filename': 'file1',
                'dirname': '/home/user',
                'type': 'file'
            };

            var nonexistentNode = {
                'filepath': '/home/user/file12',
                'filename': 'file12',
                'dirname': '/home/user',
                'type': 'file'
            }

            isolateScope.removeNode(node_1);
            isolateScope.removeNode(node_2)
            isolateScope.removeNode(nonexistentNode);
            expect(isolateScope.treeData.filetreeContents[0].children.length).toBe(0);
        });
      });
      describe('directive', function() {
          beforeEach(module('sandstone.filesystemservice'));
          beforeEach(function() {
              scope.sd = {
                  noSelections: true,
                  multipleSelections: true,
                  dirSelection: false
              };
              var el = angular.element('<div sandstone-filetree tree-data="ctrl.treeData" leaf-level="dir" selection-desc="sd"></div>');
              element = $compile(el)(scope);
              scope.$digest();

              // Get isolate scope
              isolateScope = element.isolateScope();
          });
          var getExpandedNodes = function(tpl) {
              var matches = tpl.match(/fa-caret-down/g);
              if(!matches) {
                  return [];
              }
              return matches;
          };

          var getContractedNodes = function(tpl) {
              var matches = tpl.match(/fa-caret-right/g);
              if(!matches) {
                  return [];
              }
              return matches;
          };

          var getSelectedNodes = function(tpl) {
              var matches = tpl.match(/tree-selected/g);
              if(!matches) {
                  return [];
              }
              return matches;
          };

          var getTemplate = function() {
              scope.$digest();
              return element.html();
          };

          it('should show correctly expanded nodes and leaf nodes', function() {
              // Expand the first node
              isolateScope.treeData.expandedNodes = [isolateScope.treeData.filetreeContents[0]];
              isolateScope.getDirContents(isolateScope.treeData.filetreeContents[0], true);

              var template = getTemplate();
              var expandedNodes = getExpandedNodes(template);
              var contractedNodes = getContractedNodes(template);
              expect(expandedNodes.length).toBe(1);
              expect(contractedNodes.length).toBe(5);
          });
          it('should have a single selected node', function() {
              // Select the first node
              isolateScope.describeSelection(isolateScope.treeData.filetreeContents[0], true);
              var template = getTemplate();
              var selectedNodes = getSelectedNodes(template);
              expect(selectedNodes.length).toBe(1);
          });
          it('initializeFiletree', function() {
              scope.sd = {
                  noSelections: true,
                  multipleSelections: true,
                  dirSelection: false
              };
              expect(isolateScope.selectionDesc.multipleSelections).toBe(true);
              expect(isolateScope.selectionDesc.noSelections).toBe(true);
              expect(isolateScope.selectionDesc.dirSelection).not.toBe(true);
          });
          it('should show correctly expanded nodes and leaf nodes', function() {
              // Expand the first node
              isolateScope.treeData.expandedNodes = [isolateScope.treeData.filetreeContents[0]];
              isolateScope.getDirContents(isolateScope.treeData.filetreeContents[0], true);

              var template = getTemplate();
              var expandedNodes = getExpandedNodes(template);
              var contractedNodes = getContractedNodes(template);
              expect(expandedNodes.length).toBe(1);
              expect(contractedNodes.length).toBe(5);
          });
          it('should multiple selected nodes', function() {
              scope.sd = {
                  noSelections: true,
                  multipleSelections: true,
                  dirSelection: false
              };
              // Select the first node
              isolateScope.describeSelection(isolateScope.treeData.filetreeContents[0], true);
              // Select the second node
              isolateScope.describeSelection(isolateScope.treeData.filetreeContents[1], true);

              isolateScope.treeData.selectedNodes = [isolateScope.treeData.filetreeContents[0], isolateScope.treeData.filetreeContents[1]]

              var template = getTemplate();
              var selectedNodes = getSelectedNodes(template);
              expect(selectedNodes.length).toBe(2);
          });
    });
});
