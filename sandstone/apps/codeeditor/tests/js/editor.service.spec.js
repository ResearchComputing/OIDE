'use strict';

xdescribe('sandstone.editor.EditorService', function() {
  beforeEach(module('sandstone'));
  beforeEach(module('sandstone.editor'));

  describe('sandstone.editor.EditorService settings', function() {
    var aceMock,sessMock, httpBackend;

    beforeEach(function() {
      sessMock = jasmine.createSpyObj(
        'sessMock',
        [
          'getUndoManager',
          'setUndoManager',
          'getDocument',
          'setUseSoftTabs',
          'setTabSize',
          'setUseWrapMode'
        ]
      );
      aceMock = jasmine.createSpyObj(
        'aceMock',
        [
          'setSession',
          'setShowInvisibles',
          'setFontSize',
          'setDisplayIndentGuides'
        ]
      );
      aceMock.getSession = function() {
        return sessMock;
      };
    });

    beforeEach(inject(function($httpBackend){
      httpBackend = $httpBackend;
      httpBackend.whenGET(/\/filebrowser\/localfiles.*/).respond(function(){
        var file = {
          contents: 'this is a basic file'
        };
        return [200, file];
      });
      httpBackend.whenPUT(/\/filebrowser\/localfiles.*/).respond(function(){
        return [200, {}];
      });
      httpBackend.whenPOST(/\/filebrowser\/localfiles.*/).respond(function(){
        return [200, {}];
      });
    }));

    it('starts with the correct defaults.', inject(function(EditorService) {
      var defaults = {
        showInvisibles: true,
        useSoftTabs: true,
        fontSize: 12,
        tabSize: 4,
        showIndentGuides: true,
        wordWrap: false
      };
      expect(EditorService.getSettings()).toEqual(defaults);
    }));
    it('correctly modifies settings.', inject(function(EditorService) {
      EditorService.onAceLoad(aceMock);
      var newSettings = {
        showInvisibles: false,
        useSoftTabs: false,
        fontSize: 14,
        tabSize: 2,
        showIndentGuides: false
      };
      EditorService.setSettings(newSettings);
      expect(EditorService.getSettings()).toEqual(newSettings);
      expect(sessMock.setUseSoftTabs).toHaveBeenCalledWith(false);
      expect(sessMock.setTabSize).toHaveBeenCalledWith(2);
      expect(aceMock.setShowInvisibles).toHaveBeenCalledWith(false);
      expect(aceMock.setFontSize).toHaveBeenCalledWith(14);
    }));
    it('should open a document', inject(function(EditorService){
      EditorService.onAceLoad(aceMock);
      var filepath = "/home/saurabh/file1";
      EditorService.openDocument(filepath);
      httpBackend.flush();
      expect(Object.keys(EditorService.getOpenDocs()).length).toBe(2);
      expect(EditorService.getCurrentDoc()).toBe("/home/saurabh/file1");
    }));
    it('should close a document when only 1 file', inject(function(EditorService){
      EditorService.onAceLoad(aceMock);
      var currentFile = EditorService.getCurrentDoc();
      EditorService.closeDocument(currentFile);
      expect(Object.keys(EditorService.getOpenDocs()).length).toBe(0);
    }));
    it('should close a document when multiple files are open', inject(function(EditorService){
      EditorService.onAceLoad(aceMock);
      var filename = "/home/saurabh/file1";
      EditorService.openDocument(filename);
      EditorService.closeDocument(filename);
      expect(Object.keys(EditorService.getOpenDocs()).length).toBe(1);
    }));
    it('should save a document if it exists', inject(function(EditorService){
      httpBackend.whenGET(/\/filebrowser\/a\/fileutil\?filepath=.*&operation=CHECK_EXISTS/).respond(function(){
        return [200, {result: true}];
      });
      EditorService.onAceLoad(aceMock);
      EditorService.openDocument("/home/saurabh/file1");
      httpBackend.flush();
      EditorService.saveDocument("/home/saurabh/file1");
      httpBackend.flush();
      expect(EditorService.getOpenDocs()["/home/saurabh/file1"].unsaved).not.toBeTruthy();
    }));
    it('should save a document if it doesnt exists', inject(function(EditorService){
      httpBackend.whenGET(/\/filebrowser\/a\/fileutil\?filepath=.*&operation=CHECK_EXISTS/).respond(function(){
        return [200, {result: false}];
      });
      EditorService.onAceLoad(aceMock);
      EditorService.openDocument("/home/saurabh/file1");
      httpBackend.flush();
      EditorService.saveDocument("/home/saurabh/file1");
      httpBackend.flush();
      expect(EditorService.getOpenDocs()["/home/saurabh/file1"].unsaved).not.toBeTruthy();
    }));
  });
});
