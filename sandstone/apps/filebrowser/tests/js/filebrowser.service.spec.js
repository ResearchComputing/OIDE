'use strict';

describe('sandstone.filebrowser.FilebrowserService', function() {
  var FilesystemService;
  var FilebrowserService;
  var AlertService;
  var mockResolve, mockReject;
  var $rootScope, digest;
  var volumeDetails;

  beforeEach(module('sandstone'));
  beforeEach(module('sandstone.filesystemservice'));
  beforeEach(module('sandstone.filebrowser'));

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
    // FilebrowserService automatically calls FS service methods
    volumeDetails = {
      available: '11G',
      filepath: '/volume1/',
      size: '18G',
      type: 'volume',
      used: '6.0G',
      used_pct: 36
    };
    var fsDetails = {
      groups: ['testgrp'],
      type: 'filesystem',
      volumes: [volumeDetails]
    };
    spyOn(FilesystemService,'getFilesystemDetails').and.callFake(function() {
      return mockResolve(fsDetails);
    });
  }));

  beforeEach(inject(function(_FilebrowserService_,_AlertService_,_$q_,_$rootScope_) {
    FilebrowserService = _FilebrowserService_;
    AlertService = _AlertService_;
    $rootScope = _$rootScope_;

    digest = function() {
      $rootScope.$digest();
    };
  }));

  describe('selection methods', function() {

    it('setSelectedFile',function() {
      var selection;
      var selectedFile = {'filepath': '/test/file'};
      FilebrowserService.setSelectedFile(selectedFile);
      selection = FilebrowserService.getSelection();
      expect(selection.selectedFile).toBe(selectedFile);
      // Calling with no file should clear selection
      FilebrowserService.setSelectedFile();
      selection = FilebrowserService.getSelection();
      expect(selection.selectedFile).not.toBeDefined();
    });

    it('setCwd',function() {
      var selection;
      var dirDetails = {'filepath':'/test/path'};
      var filepath = '/test/path';
      spyOn(FilesystemService,'getDirectoryDetails').and.callFake(function() {
        return mockResolve(dirDetails);
      });
      spyOn(FilesystemService,'createFilewatcher').and.callFake(function() {
        return mockResolve();
      });
      // CWD should be set, its contents retrieved, and a filewatcher should
      // be created for the dirpath
      FilebrowserService.setCwd(filepath);
      digest();
      expect(FilesystemService.getDirectoryDetails.calls.argsFor(0)).toEqual([filepath,{contents:true}]);
      expect(FilesystemService.createFilewatcher.calls.count()).toEqual(1);
      selection = FilebrowserService.getSelection();
      expect(selection.cwd).toEqual(dirDetails);
      // An alert should be raised on error
      FilesystemService.getDirectoryDetails = jasmine.createSpy().and.callFake(function() {
        return mockReject({},500);
      });
      spyOn(AlertService,'addAlert').and.returnValue('uuid-4444');
      FilebrowserService.setCwd(filepath);
      $rootScope.$digest();
      expect(AlertService.addAlert.calls.count()).toEqual(1);
    });

    it('setVolume',function() {
        var dirDetails = {'filepath':'/test/path'};
        spyOn(FilesystemService, 'getDirectoryDetails').and.callFake(function() {
            return mockResolve(dirDetails);
        });
        spyOn(FilesystemService, 'createFilewatcher').and.callFake(function() {
            return mockResolve();
        });
        FilebrowserService.setVolume(volumeDetails);
        $rootScope.$digest();
        expect(FilebrowserService.getSelection().volume).toBe(volumeDetails);
    });

  });

  describe('filewatcher events', function() {

    it('filesystem:file_created',function() {
        var selection;
        var dirDetails = {'filepath':'/test/path'};
        var filepath = '/test/path';
        spyOn(FilesystemService,'getDirectoryDetails').and.callFake(function() {
          return mockResolve(dirDetails);
        });
        spyOn(FilesystemService,'createFilewatcher').and.callFake(function() {
          return mockResolve();
        });
        FilebrowserService.setCwd(filepath);
        digest();

        var createdFileDetails = {
          type: 'file',
          filepath: '/volume1/file2',
          dirpath: '/volume1',
          name: 'file2',
          owner: 'testuser',
          group: 'testgrp',
          permissions: 'rwxrw-r--',
          size: '8.8K'
        };
        spyOn(FilesystemService, 'normalize');
        $rootScope.$emit('filesystem:file_created', createdFileDetails);
        expect(FilesystemService.normalize).toHaveBeenCalled();
    });

    it('filesystem:file_created cwd filepath is the same as dirpath', function() {
        var selection;
        var dirDetails = {'filepath':'/test/path'};
        var filepath = '/test/path';
        spyOn(FilesystemService,'getDirectoryDetails').and.callFake(function() {
          return mockResolve(dirDetails);
        });
        spyOn(FilesystemService,'createFilewatcher').and.callFake(function() {
          return mockResolve();
        });
        FilebrowserService.setCwd(filepath);
        digest();
        var createdFileDetails = {
          type: 'file',
          filepath: '/test/path/testfile',
          dirpath: '/test/path',
          name: 'testfile',
          owner: 'testuser',
          group: 'testgrp',
          permissions: 'rwxrw-r--',
          size: '8.8K'
        };
        spyOn(FilebrowserService, 'setCwd');
        $rootScope.$emit('filesystem:file_created', createdFileDetails);
        expect(FilebrowserService.setCwd).toHaveBeenCalled();
    });

    it('filesystem:file_deleted',function() {
        var selection;
        var dirDetails = {
            filepath:'/test/path',
            is_directory:true,
            dirpath: '/test'
        };
        var filepath = '/test/path';
        var selectedFile = {
          type: 'file',
          filepath: '/test/path/testfile',
          dirpath: '/test/path',
          name: 'testfile',
          owner: 'testuser',
          group: 'testgrp',
          permissions: 'rwxrw-r--',
          size: '8.8K'
        };
        spyOn(FilesystemService,'getDirectoryDetails').and.callFake(function() {
          return mockResolve(dirDetails);
        });
        spyOn(FilesystemService,'createFilewatcher').and.callFake(function() {
          return mockResolve();
        });
        FilebrowserService.setCwd(filepath);
        digest();
        FilebrowserService.setSelectedFile(selectedFile);

        // Set volume
        spyOn(FilebrowserService, 'setCwd');
        FilebrowserService.setVolume(volumeDetails);

        $rootScope.$emit('filesystem:file_deleted', dirDetails);
        expect(FilebrowserService.setCwd.calls.count()).toEqual(2);
        expect(FilebrowserService.setCwd.calls.argsFor(1)).toEqual([volumeDetails.filepath]);
    });

    it('filesystem:file_deleted dirpath === cwdPath',function() {
        var selection;
        var dirDetails = {
            filepath:'/test/path',
            is_directory:true,
            dirpath: '/test'
        };
        var filepath = '/test/path';
        var normalizedPath = FilesystemService.normalize(dirDetails.filepath);
        var selectedFile = {
          type: 'file',
          filepath: '/test/path/testfile',
          dirpath: '/test/path',
          name: 'testfile',
          owner: 'testuser',
          group: 'testgrp',
          permissions: 'rwxrw-r--',
          size: '8.8K'
        };
        spyOn(FilesystemService,'getDirectoryDetails').and.callFake(function() {
          return mockResolve(dirDetails);
        });
        spyOn(FilesystemService,'createFilewatcher').and.callFake(function() {
          return mockResolve();
        });
        FilebrowserService.setCwd(filepath);
        digest();
        FilebrowserService.setSelectedFile(selectedFile);

        // Set volume
        spyOn(FilebrowserService, 'setCwd');
        FilebrowserService.setVolume(volumeDetails);

        $rootScope.$emit('filesystem:file_deleted', selectedFile);
        expect(FilebrowserService.setCwd.calls.count()).toEqual(2);
        expect(FilebrowserService.setCwd.calls.argsFor(1)).toEqual([normalizedPath]);
    });

    it('filesystem:file_moved destDir==cwdPath',function() {
        var selection;
        var dirDetails = {
            filepath:'/test/path',
            is_directory:true,
            dirpath: '/test'
        };
        var filepath = '/test/path';
        var normalizedPath = FilesystemService.normalize(dirDetails.filepath);
        var selectedFile = {
          type: 'file',
          filepath: '/test/path/testfile',
          dirpath: '/test/path',
          name: 'testfile',
          owner: 'testuser',
          group: 'testgrp',
          permissions: 'rwxrw-r--',
          size: '8.8K'
        };
        var movedFile = {
            src_dirpath: '/test/path',
            dest_dirpath: '/test/path',
            src_filepath: '/test/path/testfile',
            dest_filepath: '/test/path/testfile1'
        };
        spyOn(FilesystemService,'getDirectoryDetails').and.callFake(function() {
          return mockResolve(dirDetails);
        });
        spyOn(FilesystemService,'createFilewatcher').and.callFake(function() {
          return mockResolve();
        });
        FilebrowserService.setCwd(filepath);
        digest();
        FilebrowserService.setSelectedFile(selectedFile);

        spyOn(FilebrowserService, 'setCwd');
        spyOn(FilebrowserService, 'setSelectedFile');
        $rootScope.$emit('filesystem:file_moved', movedFile);
        expect(FilebrowserService.setCwd).toHaveBeenCalled();
        expect(FilebrowserService.setSelectedFile).toHaveBeenCalled();
    });

    it('filesystem:file_moved srcPath != selPath',function() {
        var selection;
        var dirDetails = {
            filepath:'/test/path',
            is_directory:true,
            dirpath: '/test'
        };
        var filepath = '/test/path';
        var normalizedPath = FilesystemService.normalize(dirDetails.filepath);
        var selectedFile = {
          type: 'file',
          filepath: '/test/path/testfile',
          dirpath: '/test/path',
          name: 'testfile',
          owner: 'testuser',
          group: 'testgrp',
          permissions: 'rwxrw-r--',
          size: '8.8K'
        };
        var movedFile = {
            src_dirpath: '/test/path',
            dest_dirpath: '/test/path',
            src_filepath: '/test/path/testfile1',
            dest_filepath: '/test/path/testfile2'
        };
        spyOn(FilesystemService,'getDirectoryDetails').and.callFake(function() {
          return mockResolve(dirDetails);
        });
        spyOn(FilesystemService,'createFilewatcher').and.callFake(function() {
          return mockResolve();
        });
        FilebrowserService.setCwd(filepath);
        digest();
        FilebrowserService.setSelectedFile(selectedFile);

        spyOn(FilebrowserService, 'setCwd');
        spyOn(FilebrowserService, 'setSelectedFile');
        $rootScope.$emit('filesystem:file_moved', movedFile);
        expect(FilebrowserService.setCwd).toHaveBeenCalled();
        expect(FilebrowserService.setSelectedFile).not.toHaveBeenCalled();
    });
  });

});
