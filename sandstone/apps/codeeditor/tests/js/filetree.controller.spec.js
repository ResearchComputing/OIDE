describe('filetree', function(){
  var controller;
  var $filetreeService;
  var filetreeCtrl;
  var httpBackend;
  var $compile;
  var rootScope;
  var filesystemService;
  var editorService;
  var modal;
  var dirs = [{
        "filepath": "/home/saurabh/dir1",
        "filename": "dir1",
        "group": "saurabh",
        "is_accessible": true,
        "perm": "-rw-rw-r--",
        "perm_string": "664",
        "size": "4.0 KiB",
        "type": "dir"
      }, {
        "filepath": "/home/saurabh/dir2",
        "filename": "dir2",
        "group": "root",
        "is_accessible": false,
        "perm": "-rw-r--r--",
        "perm_string": "644",
        "size": "4.0 KiB",
        "type": "dir"
      },
      {
        "filepath": "/home/saurabh/dir3",
        "filename": "dir3",
        "group": "saurabh",
        "is_accessible": true,
        "perm": "-rw-rw-r--",
        "perm_string": "664",
        "size": "4.0 KiB",
        "type": "dir"
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
        }];

  var mockModal = {
    result: {
      then: function(confirmCallback, cancelCallback) {
        this.confirmCallback = confirmCallback;
        this.cancelCallback = cancelCallback;
      }
    },
    close: function() {
      this.result.confirmCallback();
    },
    dismiss: function() {
      this.result.cancelCallback();
    }
  };

  beforeEach(module('sandstone'));
  beforeEach(module('sandstone.editor'));
  beforeEach(module('sandstone.filesystemservice'));
  beforeEach(module('sandstone.templates'));
  beforeEach(module('sandstone.filetreedirective'));
  beforeEach(module('ui.bootstrap'));
  beforeEach(module('sandstone.broadcastservice'));

  var mockBroadcastService;
  beforeEach(module(function($provide) {
      $provide.service('BroadcastService', function() {
          this.sendMessage = function(message) {
              if(message.key == 'filetree:expanded') {
                  rootScope.$emit('filetree:got_contents', {
                      contents: files,
                      node: dirs[0]
                  })
              } else if(message.key == 'filetree:delete_files') {
                  scope.ctrl.treeData.filetreeContents.splice(0, 1);
                  rootScope.$emit('filetree:files_deleted', {});
              }
          }
      });
  }));

  beforeEach(inject(function($controller, $rootScope, $log, $document, $httpBackend, _$compile_, FilesystemService, EditorService, _$modal_, BroadcastService){
    scope = $rootScope.$new();
    rootScope = $rootScope;
    $compile = _$compile_;
    httpBackend = $httpBackend;
    filesystemService = FilesystemService;
    editorService = EditorService;
    modal = _$modal_;
    mockBroadcastService = BroadcastService;
    controller = $controller;
    controller = $controller('FiletreeCtrl', {
      $scope: scope,
      $document: $document,
      $log: $log,
      BroadcastService: mockBroadcastService
    });
    scope.ctrl = controller;
    scope.$apply();
    var element = angular.element('<div sandstone-filetree tree-data="ctrl.treeData" leaf-level="file" selection-desc="ctrl.sd"></div>');
    el = $compile(element)(scope);
    scope.$digest();
    scope.ctrl.treeData.filetreeContents = dirs;
  }));

  describe('Whether the filetree is working as expected or not', function(){
    //Expect Filetree service to be defined
    it('Controller initialization should be proper', function(){
      expect(scope.ctrl).toBeDefined();
      expect(scope.ctrl.treeData).toBeDefined();
      expect(scope.ctrl.treeData.filetreeContents).toBeDefined();
      expect(scope.ctrl.treeData.filetreeContents.length).toBe(3);
    });
    it('should have valid default treeOptions loaded', function(){
      expect(scope.ctrl.sd).toBeDefined();
      expect(scope.ctrl.sd.multipleSelections).not.toBeTruthy();
    });
    it('should copy files to clipboard', function(){
      scope.ctrl.treeData.selectedNodes = [files[0], files[1]];
      scope.ctrl.copyFiles();
      // Expect clipboard length to be 2
      expect(scope.ctrl.clipboard.length).toBe(2);
    });
    it('should paste the selected files', function(){
      scope.ctrl.treeData.selectedNodes = [files[0], files[1]];
      scope.ctrl.copyFiles();
      scope.ctrl.treeData.selectedNodes = [dirs[0]]
      scope.ctrl.pasteFiles();
      // Expect clipboard length to be zero
      expect(scope.ctrl.clipboard.length).toBe(0);
    });
    it('should open files in editor', function(){
      spyOn(editorService, 'openDocument');
      scope.ctrl.treeData.selectedNodes = [files[0]];
      scope.ctrl.openFilesInEditor();
      // As files are selected, the method should be invoked
      expect(editorService.openDocument).toHaveBeenCalled();
    })
    it('if no files are selected, openDocument should not do anything', function(){
      spyOn(editorService, 'openDocument');
      scope.ctrl.treeData.selectedNodes = [];
      scope.ctrl.openFilesInEditor();
      // As nothing is selected, the method should not be called
      expect(editorService.openDocument).not.toHaveBeenCalled();
    });
    it('should delete a file', function(){
      spyOn(modal, "open").and.callFake(function(){
        return mockModal;
      });
      scope.ctrl.treeData.selectedNodes = [dirs[0]];
      scope.ctrl.deleteFiles();
      scope.ctrl.deleteModalInstance.close();
      expect(scope.ctrl.treeData.filetreeContents.length).toBe(2);
    });
  });

});
