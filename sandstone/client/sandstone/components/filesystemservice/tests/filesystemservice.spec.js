describe('sandstone.filesystemservice', function() {
  var FilesystemService;

  beforeEach(module('sandstone'));
  beforeEach(module('sandstone.filesystemservice'));

  beforeEach(inject(function(_FilesystemService_) {
    FilesystemService = _FilesystemService_;
  }));

  describe('filepath manipulations', function() {

    it('basename',function() {
      var path;
      path = FilesystemService.basename('/a/dir/');
      expect(path).toEqual('');
      path = FilesystemService.basename('/a/file');
      expect(path).toEqual('file');
    });

    it('dirname',function() {
      var path;
      path = FilesystemService.dirname('file');
      expect(path).toEqual('.');
      path = FilesystemService.dirname('/a/file');
      expect(path).toEqual('/a');
      path = FilesystemService.dirname('/a/dir/');
      expect(path).toEqual('/a/dir');
    });

    it('join',function() {
      var path;
      path = FilesystemService.join('/a/','../','/dir/');
      expect(path).toEqual('/dir/');
      path = FilesystemService.join('a/','rel','path');
      expect(path).toEqual('a/rel/path');
    });

    it('normalize',function() {
      var path;
      path = FilesystemService.normalize('/./a/..//dir/');
      expect(path).toEqual('/dir');
      path = FilesystemService.normalize('./a/..//dir/');
      expect(path).toEqual('dir');
    });

  });

  describe('filesystem methods', function() {
    var $httpBackend;

    beforeEach(inject(function(_$httpBackend_) {
      $httpBackend = _$httpBackend_;
    }));

    afterEach(function() {
      $httpBackend.flush();
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('getFilesystemDetails', function() {
      var fsDetails = {
        groups: ['testgrp'],
        type: 'filesystem',
        volumes: [{
          available: '11G',
          filepath: '/volume1/',
          size: '18G',
          type: 'volume',
          used: '6.0G',
          used_pct: 36
        }]
      };
      $httpBackend.whenGET('/a/filesystem/').respond(function() {
        return [200, fsDetails];
      });

      var getFsDetails = FilesystemService.getFilesystemDetails();
      getFsDetails.then(
        function(data) {
          expect(data instanceof FilesystemService.Filesystem).toBe(true);
        }
      );
    });

    it('rename', function() {
      var filepath = '/test/path';
      var newName = 'newpath';
      expRequest = {
        filepath: filepath,
        action: {
          action: 'rename',
          newname: newName
        }
      }
      $httpBackend.whenPUT('/a/filesystem/').respond(function() {
        return [200, encodeURIComponent('/test/newpath')];
      });

      $httpBackend.expectPUT('/a/filesystem/',expRequest);
      FilesystemService.rename(filepath,newName);
    });

    it('move', function() {
      var filepath = '/test/path';
      var newpath = '/test/newpath';
      expRequest = {
        filepath: filepath,
        action: {
          action: 'move',
          newpath: newpath
        }
      }
      $httpBackend.whenPUT('/a/filesystem/').respond(function() {
        return [200, encodeURIComponent('/test/newpath')];
      });

      $httpBackend.expectPUT('/a/filesystem/',expRequest);
      FilesystemService.move(filepath,newpath);
    });

    it('copy', function() {
      var filepath = '/test/path';
      var newpath = '/test/newpath';
      expRequest = {
        filepath: filepath,
        action: {
          action: 'copy',
          copypath: newpath
        }
      }
      $httpBackend.whenPUT('/a/filesystem/').respond(function() {
        return [200, encodeURIComponent('/test/newpath')];
      });

      $httpBackend.expectPUT('/a/filesystem/',expRequest);
      FilesystemService.copy(filepath,newpath);
    });

  });

});
