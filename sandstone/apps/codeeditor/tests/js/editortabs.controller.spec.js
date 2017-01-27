describe('sandstone.editor tabs', function(){
  var scope;
  var $editorService;
  var httpBackend;
  var modal;

  var mockSaveAsModal = {
    result: {
      then: function(confirmCallback, cancelCallback) {
        this.confirmCallback = confirmCallback;
        this.cancelCallback = cancelCallback;
      }
    },
    close: function() {
      var file = {
        oldFilePath: '',
        newFilePath: '/home/saurabh/file1'
      };
      this.result.confirmCallback(file);
    },
    dismiss: function() {
      this.result.cancelCallback();
    }
  };

  beforeEach(module('sandstone'));
  beforeEach(module('sandstone.editor'));
  beforeEach(module('sandstone.filesystemservice'));
  beforeEach(module('ui.bootstrap'));

  beforeEach(inject(function($controller, $rootScope, $modal, $log, EditorService, $httpBackend){
    scope = $rootScope.$new();
    controller = $controller;
    $editorService = EditorService;
    modal = $modal;
    httpBackend = $httpBackend;
    httpBackend.whenGET('/filebrowser/filetree/a/dir').respond(function(){
      return [200, []];
    });
    controller = $controller('EditorTabsCtrl', {
      $scope: scope,
      EditorService: EditorService,
      $modal: $modal,
      $log: $log
    });
    scope.ctrl = controller;
    scope.$apply();
  }));

  describe('tabs controller specs', function(){
    it('EditorService should be defined', function(){
      // httpBackend.flush();
      expect($editorService).toBeDefined();
    });
    it('get open docs should be called', function(){
      // httpBackend.flush();
      spyOn($editorService, 'getOpenDocs');
      scope.ctrl.getOpenDocs();
      expect($editorService.getOpenDocs).toHaveBeenCalled();
    });
    it('should open doc', function(){
      // httpBackend.flush();
      spyOn($editorService, 'openDocument');
      scope.ctrl.openDocument('/home/saurabh/file1');
      expect($editorService.openDocument).toHaveBeenCalled();
    });
    it('should save document', function(){
      // httpBackend.flush();
      spyOn($editorService, 'saveDocument');
      scope.ctrl.saveDocument({filepath: '/home/saurabh/file1'});
      expect($editorService.saveDocument).toHaveBeenCalled();
    });
    it('should undo changes', function(){
      // httpBackend.flush();
      spyOn($editorService, 'undoChanges');
      scope.ctrl.undoChanges({filepath: '/home/saurabh/file1'});
      expect($editorService.undoChanges).toHaveBeenCalled();
    });
    it('should redo changes', function(){
      // httpBackend.flush();
      spyOn($editorService, 'redoChanges');
      scope.ctrl.redoChanges({filepath: '/home/saurabh/file1'});
      expect($editorService.redoChanges).toHaveBeenCalled();
    });
    it('should copy selection', function(){
      // httpBackend.flush();
      spyOn($editorService, 'copySelection');
      scope.ctrl.copySelection();
      expect($editorService.copySelection).toHaveBeenCalled();
    });
    it('should cut selection', function(){
      // httpBackend.flush();
      spyOn($editorService, 'cutSelection');
      scope.ctrl.cutSelection();
      expect($editorService.cutSelection).toHaveBeenCalled();
    });
    it('should paste to clipboard', function(){
      // httpBackend.flush();
      spyOn($editorService, 'pasteClipboard');
      scope.ctrl.pasteClipboard();
      expect($editorService.pasteClipboard).toHaveBeenCalled();
    });
    it('should comment selection', function(){
      // httpBackend.flush();
      spyOn($editorService, 'commentSelection');
      scope.ctrl.commentSelection();
      expect($editorService.commentSelection).toHaveBeenCalled();
    });
    it('should open search box', function(){
      // httpBackend.flush();
      spyOn($editorService, 'openSearchBox');
      scope.ctrl.openSearchBox();
      expect($editorService.openSearchBox).toHaveBeenCalled();
    });

    it('should save file as', function(){
      spyOn(modal, "open").and.callFake(function(){
        return mockSaveAsModal;
      });
      spyOn($editorService, "fileRenamed");
      spyOn($editorService, "saveDocument");
      var tab = {
        'filepath': '/home/saurabh/file1',
        'saveFile': true
      };
      scope.ctrl.saveDocumentAs(tab);
      scope.ctrl.saveAsModalInstance.close();
      expect($editorService.fileRenamed).toHaveBeenCalled();
      expect($editorService.saveDocument).toHaveBeenCalled();
    });

    it('should save previously unsaved file as', function(){
      spyOn(modal, "open").and.callFake(function(){
        return mockSaveAsModal;
      });
      var tab = {
        'filepath': '-/',
        'filepath': '/home/saurabh/file1',
        'saveFile': true,
        'unsaved': true
      };
      spyOn($editorService, "closeDocument");
      var e = {
        preventDefault: function() {}
      };
      scope.ctrl.closeDocument(e,tab);
      scope.ctrl.unsavedModalInstance.close();
      expect($editorService.closeDocument).toHaveBeenCalled();
    });

  });
});
