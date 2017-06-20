describe('sandstone.editor tabs', function(){
  var scope;
  var EditorService;
  var httpBackend;
  var modal;
  var $q

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

  beforeEach(inject(function($controller, $rootScope, $uibModal, $log, _EditorService_, $httpBackend, _$q_){
    $q = _$q_;
    scope = $rootScope.$new();
    controller = $controller;
    EditorService = _EditorService_;
    modal = $uibModal;
    httpBackend = $httpBackend;
    httpBackend.whenGET('/filebrowser/filetree/a/dir').respond(function(){
      return [200, []];
    });
    controller = $controller('EditorTabsCtrl', {
      $scope: scope,
      EditorService: EditorService,
      $uibModal: $uibModal,
      $log: $log
    });
    scope.ctrl = controller;
    scope.$apply();
  }));

  describe('tabs controller specs', function(){
    it('EditorService should be defined', function(){
      // httpBackend.flush();
      expect(EditorService).toBeDefined();
    });
    it('get open docs should be called', function(){
      // httpBackend.flush();
      spyOn(EditorService, 'getOpenDocs');
      scope.ctrl.getOpenDocs();
      expect(EditorService.getOpenDocs).toHaveBeenCalled();
    });
    it('should open doc', function(){
      var deferredOpenDocument = $q.defer();
      deferredOpenDocument.resolve();
      spyOn(EditorService, 'openDocument').and.returnValue(deferredOpenDocument.promise);
      spyOn(EditorService, 'setSession').and.returnValue(true);
      scope.ctrl.openDocument('/home/saurabh/file1');
      scope.$digest();
      expect(EditorService.setSession).toHaveBeenCalledWith('/home/saurabh/file1');
      expect(EditorService.openDocument).not.toHaveBeenCalled();
      scope.ctrl.openDocument();
      scope.$digest();
      expect(EditorService.openDocument).toHaveBeenCalled();
    });
    it('should save document', function(){
      // httpBackend.flush();
      spyOn(EditorService, 'saveDocument');
      scope.ctrl.saveDocument({filepath: '/home/saurabh/file1'});
      expect(EditorService.saveDocument).toHaveBeenCalled();
    });
    it('should undo changes', function(){
      // httpBackend.flush();
      spyOn(EditorService, 'undoChanges');
      scope.ctrl.undoChanges({filepath: '/home/saurabh/file1'});
      expect(EditorService.undoChanges).toHaveBeenCalled();
    });
    it('should redo changes', function(){
      // httpBackend.flush();
      spyOn(EditorService, 'redoChanges');
      scope.ctrl.redoChanges({filepath: '/home/saurabh/file1'});
      expect(EditorService.redoChanges).toHaveBeenCalled();
    });
    it('should copy selection', function(){
      // httpBackend.flush();
      spyOn(EditorService, 'copySelection');
      scope.ctrl.copySelection();
      expect(EditorService.copySelection).toHaveBeenCalled();
    });
    it('should cut selection', function(){
      // httpBackend.flush();
      spyOn(EditorService, 'cutSelection');
      scope.ctrl.cutSelection();
      expect(EditorService.cutSelection).toHaveBeenCalled();
    });
    it('should paste to clipboard', function(){
      // httpBackend.flush();
      spyOn(EditorService, 'pasteClipboard');
      scope.ctrl.pasteClipboard();
      expect(EditorService.pasteClipboard).toHaveBeenCalled();
    });
    it('should comment selection', function(){
      // httpBackend.flush();
      spyOn(EditorService, 'commentSelection');
      scope.ctrl.commentSelection();
      expect(EditorService.commentSelection).toHaveBeenCalled();
    });
    it('should open search box', function(){
      // httpBackend.flush();
      spyOn(EditorService, 'openSearchBox');
      scope.ctrl.openSearchBox();
      expect(EditorService.openSearchBox).toHaveBeenCalled();
    });

    it('should save file as', function(){
      spyOn(modal, "open").and.callFake(function(){
        return mockSaveAsModal;
      });
      spyOn(EditorService, "fileRenamed");
      spyOn(EditorService, "saveDocument");
      var tab = {
        'filepath': '/home/saurabh/file1',
        'saveFile': true
      };
      scope.ctrl.saveDocumentAs(tab);
      scope.ctrl.saveAsModalInstance.close();
      expect(EditorService.fileRenamed).toHaveBeenCalled();
      expect(EditorService.saveDocument).toHaveBeenCalled();
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
      spyOn(EditorService, "closeDocument");
      var e = {
        preventDefault: function() {}
      };
      scope.ctrl.closeDocument(e,tab);
      scope.ctrl.unsavedModalInstance.close();
      expect(EditorService.closeDocument).toHaveBeenCalled();
    });

    it('prompts the user when the current document has changed on disk', function() {});

  });
});
