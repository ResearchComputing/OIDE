'use strict';

describe('sandstone.editor.EditorService', function() {
  var FilesystemService;
  var EditorService;
  var AlertService;
  var mockResolve, mockReject;
  var $rootScope, digest;

  beforeEach(module('sandstone'));
  beforeEach(module('sandstone.filesystemservice'));
  beforeEach(module('sandstone.editor'));

  beforeEach(inject(function(_FilesystemService_,_$q_,_$rootScope_) {
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

    FilesystemService = _FilesystemService_;
  }));

  beforeEach(inject(function(_EditorService_,_AlertService_,_$q_,_$rootScope_) {
    EditorService = _EditorService_;
    AlertService = _AlertService_;
    $rootScope = _$rootScope_;

    digest = function() {
      $rootScope.$digest();
    };
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

    it('reloads the contents of an edit session from disk', function() {});

    it('closes a document and removes filewatchers', function() {});

    it('saves a document and suppresses notifications', function() {});

    it('creates and saves to a new file if one does exist on disk', function() {});

    it('updates the document when a file is renamed', function() {});

  });

});
