'use strict';

describe('sandstone.editor.EditorService', function() {
  var FilesystemService;
  var EditorService;
  var AlertService;
  var mockResolve, mockReject;
  var $rootScope, $q, $window;

  beforeEach(module('sandstone'));
  beforeEach(module('sandstone.filesystemservice'));
  beforeEach(module('sandstone.editor'));

  beforeEach(inject(function(_FilesystemService_,_$q_,_EditorService_,_AlertService_,_$rootScope_,_$window_) {
    mockResolve = function(data) {
      var deferred = _$q_.defer();
      deferred.resolve(data);
      return deferred.promise;
    };
    mockReject = function(data) {
      var deferred = _$q_.defer();
      deferred.reject(data);
      return deferred.promise;
    };

    $q = _$q_;
    FilesystemService = _FilesystemService_;
    EditorService = _EditorService_;
    AlertService = _AlertService_;
    $rootScope = _$rootScope_;
    $window = _$window_;
  }));

  describe('ace editor methods', function() {

    it('creates an untitled document on start up if no active sessions exist', function() {});

    it('loads active session on start up if one exists', function() {});

    it('creates a new ace edit session', function() {});

    it('multi-step undo stack', function() {});

    it('multi-step redo stack', function() {});

  });

  describe('document methods', function() {

    it('switches between edit sessions', function() {});

    it('creates a new untitled document', function() {});

    it('loads a document from disk', function() {});

    it('reloads the contents of an edit session from disk', function() {
      var testPath = '/a/test.txt';
      var testContents = 'file contents\n';
      var deferredGetFileContents = $q.defer();
      deferredGetFileContents.resolve(testContents);
      spyOn(FilesystemService,'getFileContents').and.returnValue(deferredGetFileContents.promise);
      EditorService._openDocs[testPath] = {
        session: {setValue: function() {}},
        changedOnDisk: true
      };
      var testDoc = EditorService._openDocs[testPath];
      spyOn(EditorService._openDocs[testPath].session,'setValue');
      EditorService.reloadDocument(testPath);
      $rootScope.$digest();
      expect(EditorService._openDocs[testPath].session.setValue).toHaveBeenCalledWith(testContents);
      expect(testDoc.changedOnDisk).toEqual(false);
      expect(testDoc.unsaved).toEqual(false);
    });

    it('closes a document and removes filewatchers', function() {});

    it('saves a document and suppresses notifications', function() {});

    it('creates and saves to a new file if one does not exist on disk', function() {});

    it('updates the document when a file is renamed', function() {});

  });

  describe('events and signals', function() {

    it('editor:open-document opens a document', function() {});

    it('filesystem:file_modified marks doc changed unless suppressed', function() {
      var testPath = '/a/test.txt';
      EditorService._openDocs[testPath] = {
        changedOnDisk: false,
        suppressChangeNotification: true,
        unsaved: false
      };
      var testDoc = EditorService._openDocs[testPath];
      $rootScope.$emit('filesystem:file_modified',{filepath:testPath});
      $rootScope.$digest();
      expect(testDoc.changedOnDisk).toBe(false);
      expect(testDoc.suppressChangeNotification).toBe(false);
      expect(testDoc.unsaved).toBe(false);
      $rootScope.$emit('filesystem:file_modified',{filepath:testPath});
      $rootScope.$digest();
      expect(testDoc.changedOnDisk).toBe(true);
      expect(testDoc.suppressChangeNotification).toBe(false);
      expect(testDoc.unsaved).toBe(true);
    });

  });

});
