describe('Filetree directive', function(){
  var $compile;
  var scope;
  var element;
  var httpBackend;
  var rootScope;
  var filesystemservice;
  var isolateScope;
  var dirs = [{
        "filepath": "/home/saurabh/dir1",
        "filename": "dir1",
        "group": "saurabh",
        "is_accessible": true,
        "perm": "-rw-rw-r--",
        "perm_string": "664",
        "size": "4.0 KiB",
        "type": "dir",
        "children": []
      }, {
        "filepath": "/home/saurabh/dir2",
        "filename": "dir2",
        "group": "root",
        "is_accessible": false,
        "perm": "-rw-r--r--",
        "perm_string": "644",
        "size": "4.0 KiB",
        "type": "dir",
        "children": []
      },
      {
        "filepath": "/home/saurabh/dir3",
        "filename": "dir3",
        "group": "saurabh",
        "is_accessible": true,
        "perm": "-rw-rw-r--",
        "perm_string": "664",
        "size": "4.0 KiB",
        "type": "dir",
        "children": []
      },
      {
        "filepath": "/home/saurabh/dir4",
        "filename": "dir4",
        "group": "saurabh",
        "is_accessible": true,
        "perm": "-rw-rw-r--",
        "perm_string": "664",
        "size": "4.0 KiB",
        "type": "dir",
        "children": []
      }];

    var files = [{
          "filepath": "/home/saurabh/file1",
          "filename": "file1",
          "group": "saurabh",
          "is_accessible": true,
          "perm": "-rw-rw-r--",
          "perm_string": "664",
          "size": "4.0 KiB",
          "type": "dir"
        }, {
          "filepath": "/home/saurabh/file2",
          "filename": "file2",
          "group": "root",
          "is_accessible": false,
          "perm": "-rw-r--r--",
          "perm_string": "644",
          "size": "4.0 KiB",
          "type": "dir"
        },
        {
          "filepath": "/home/saurabh/dir4/file2",
          "filename": "file2",
          "group": "root",
          "is_accessible": false,
          "perm": "-rw-r--r--",
          "perm_string": "644",
          "size": "4.0 KiB",
          "type": "dir"
        }];

  beforeEach(module('sandstone'));
  beforeEach(module('sandstone.editor'));
  beforeEach(module('sandstone.filesystemservice'));
  beforeEach(module('sandstone.templates'));
  beforeEach(module('sandstone.filetreedirective'));

  beforeEach(inject(function($rootScope, _$compile_, $httpBackend, FilesystemService){
    $compile = _$compile_;
    scope = $rootScope.$new();
    rootScope = $rootScope;
    httpBackend = $httpBackend;
    filesystemservice = FilesystemService;

    httpBackend.whenGET('/filebrowser/filetree/a/dir').respond(function(){
      return [200, dirs];
    });
    scope.$apply();
    var el = angular.element('<div sandstone-filetree tree-data="ctrl.treeData" leaf-level="file" selection-desc="ctrl.sd"></div>');
    element = $compile(el)(scope);
    scope.$digest();
    httpBackend.flush();

    // Get isolate scope
    isolateScope = element.isolateScope();
  }));

  describe('Filetreedirective controller tests', function(){
    it('should be initialized properly', function(){
      // Create spies
      spyOn(isolateScope, 'updateFiletree');
      spyOn(isolateScope, 'deletedFile');
      spyOn(isolateScope, 'pastedFiles');

      expect(isolateScope.leafLevel).toBe("file");
      expect(isolateScope.selectionDesc.noSelections).toBeTruthy();
      expect(isolateScope.selectionDesc.multipleSelections).not.toBeTruthy();
      expect(isolateScope.selectionDesc.dirSelected).not.toBeTruthy();
      expect(isolateScope.treeData.filetreeContents.length).toBe(4);
      // Refresh
      rootScope.$emit('refreshFiletree');
      expect(isolateScope.updateFiletree).toHaveBeenCalled();
      // Deleted File
      rootScope.$emit('deletedFile', dirs[0]);
      expect(isolateScope.deletedFile).toHaveBeenCalled();
      // Pasted File
      rootScope.$emit('pastedFiles', dirs[0].filepath);
      expect(isolateScope.pastedFiles).toHaveBeenCalled();
    });

    it('should be able to get files for a folder', function(){
      spyOn(filesystemservice, 'getFiles');
      isolateScope.getDirContents(dirs[0], true);
      expect(filesystemservice.getFiles).toHaveBeenCalled();
    });

    it('should return the node given a filepath', function() {
      var node = isolateScope.getNodeFromPath('/home/saurabh/dir1', isolateScope.treeData.filetreeContents);
      // Expect node parameters to match
      expect(node.filepath).toBe('/home/saurabh/dir1');
      expect(node.filename).toBe('dir1');
      expect(node.group).toBe('saurabh');
      expect(node.is_accessible).toBeTruthy();
      expect(node.perm).toBe('-rw-rw-r--');
      expect(node.perm_string).toBe('664');
      expect(node.size).toBe('4.0 KiB');
    });

    it('should return null in case node doesnt exist', function(){
      var node = isolateScope.getNodeFromPath('/home/saurabh/dir111', isolateScope.treeData.filetreeContents);
      expect(node).not.toBeDefined();
    });

    it('should return file paths for a given directory', function(){
      httpBackend.expectGET(/\/filebrowser\/filetree\/a\/dir\?dirpath=.*/).respond(function(){
        return [200, files];
      });
      isolateScope.getDirContents(isolateScope.treeData.filetreeContents[0], true);
      httpBackend.flush();
      var node = isolateScope.getNodeFromPath(isolateScope.treeData.filetreeContents[0].filepath, isolateScope.treeData.filetreeContents);
      expect(node.children.length).toBe(3);
    });

    it('should remove a node from the filetree', function(){
      var node = isolateScope.treeData.filetreeContents[3];
      node.children[0] = files[2];
      var childNode = node.children[0];
      isolateScope.treeData.selectedNodes = [childNode];
      isolateScope.removeNodeFromFiletree(childNode);
      expect(isolateScope.treeData.filetreeContents[3].children.length).toBe(0);
      expect(isolateScope.treeData.selectedNodes.length).toBe(0);
    });

    it('should return true if given filepath is expanded', function(){
      isolateScope.treeData.expandedNodes = [dirs[0]];
      expect(isolateScope.isExpanded(dirs[0].filepath)).toBeTruthy();
    });

    it('should return false if given filepath is not expanded', function(){
      expect(isolateScope.isExpanded(dirs[0].filepath)).not.toBeTruthy();
    });

    it('should describe the selection', function(){
      var node = isolateScope.treeData.filetreeContents[0];
      isolateScope.describeSelection(node, true);
      expect(isolateScope.treeData.selectedNodes.length).toBe(1);
      isolateScope.describeSelection(node, false);
      expect(isolateScope.treeData.selectedNodes.length).toBe(0);
    });

  });

});
