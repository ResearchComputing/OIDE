'use strict';

describe('sandstone.filebrowser.DetailsCtrl', function() {
  var FilesystemService, FilebrowserService, AlertService;
  var ctrl;
  var $controller;
  var $rootScope, $scope;
  var mockResolve, mockReject;
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

    $rootScope = _$rootScope_;

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

  beforeEach(inject(function(_FilebrowserService_,_AlertService_,_$controller_) {
    AlertService = _AlertService_;
    FilebrowserService = _FilebrowserService_;
    $controller = _$controller_;

    $scope = $rootScope.$new();
    ctrl = $controller('DetailsCtrl', {$scope:$scope});

  }));

  describe('breadcrumbs', function() {

    it('are empty when there is no selection',function() {
        expect(ctrl.breadcrumbs.length).toBe(0);
    });

    it('change when the selection changes',function() {
        spyOn(FilesystemService,'getDirectoryDetails').and.callFake(function() {
          return mockResolve(volumeDetails);
        });
        spyOn(FilesystemService,'createFilewatcher').and.callFake(function() {
          return mockResolve();
        });
        FilebrowserService.setVolume(volumeDetails);
        $rootScope.$digest();
        expect(ctrl.breadcrumbs).toEqual(['/volume1']);
    });

    it('show volume path as a single crumb',function() {
        var volume = {
          available: '11G',
          filepath: '/volume1/test/path',
          size: '18G',
          type: 'volume',
          used: '6.0G',
          used_pct: 36
        };
        spyOn(FilesystemService,'getDirectoryDetails').and.callFake(function() {
          return mockResolve(volume);
        });
        spyOn(FilesystemService,'createFilewatcher').and.callFake(function() {
          return mockResolve();
        });
        FilebrowserService.setVolume(volume);
        $rootScope.$digest();
        expect(ctrl.breadcrumbs.length).toBe(1);
        expect(ctrl.breadcrumbs).toEqual(['/volume1/test/path']);
    });

    it('correctly decompose selected filepath into crumbs',function() {
        var volume = {
          available: '11G',
          filepath: '/volume1/test/path',
          size: '18G',
          type: 'volume',
          used: '6.0G',
          used_pct: 36
        };
        var dirDetails = {
            filepath:'/testdir',
            is_directory:true,
            dirpath: '/'
        };
        spyOn(FilesystemService,'getDirectoryDetails').and.callFake(function() {
          return mockResolve(dirDetails);
        });
        spyOn(FilesystemService,'createFilewatcher').and.callFake(function() {
          return mockResolve();
        });
        FilebrowserService.setVolume(volume);
        $rootScope.$digest();
        FilebrowserService.setCwd(dirDetails.filepath);
        expect(ctrl.breadcrumbs.length).toBe(2);
        expect(ctrl.breadcrumbs).toEqual(['/volume1/test/path', 'testdir']);
    });

    it('change directories when selected index==0',function() {
        var volume = {
          available: '11G',
          filepath: '/volume1/test/path',
          size: '18G',
          type: 'volume',
          used: '6.0G',
          used_pct: 36
        };
        var dirDetails = {
            filepath:'/testdir',
            is_directory:true,
            dirpath: '/'
        };
        spyOn(FilesystemService,'getDirectoryDetails').and.callFake(function() {
          return mockResolve(dirDetails);
        });
        spyOn(FilesystemService,'createFilewatcher').and.callFake(function() {
          return mockResolve();
        });
        FilebrowserService.setVolume(volume);
        $rootScope.$digest();
        spyOn(ctrl, 'changeDirectory');
        ctrl.selectCrumb(0);
        expect(ctrl.changeDirectory).toHaveBeenCalledWith(volume.filepath);
    });

    it('change directories when selected index!=0',function() {
        var volume = {
          available: '11G',
          filepath: '/volume1/test/path',
          size: '18G',
          type: 'volume',
          used: '6.0G',
          used_pct: 36
        };
        var dirDetails = {
            filepath:'/testdir/test2',
            is_directory:true,
            dirpath: '/testdir'
        };
        spyOn(FilesystemService,'getDirectoryDetails').and.callFake(function() {
          return mockResolve(dirDetails);
        });
        spyOn(FilesystemService,'createFilewatcher').and.callFake(function() {
          return mockResolve();
        });
        FilebrowserService.setVolume(volume);
        $rootScope.$digest();
        spyOn(ctrl, 'changeDirectory');
        ctrl.selectCrumb(1);
        expect(ctrl.changeDirectory).toHaveBeenCalledWith('/volume1/test/path/testdir');
    });

  });

  describe('navigation', function() {
    // Double-clicking in Directory Details triggers openDirectory()
    // Single-clicking triggers selectFile

    it('openDirectory selected file if type is file',function() {
        var file = {
            filepath:'/testdir/test2',
            is_directory:false,
            type: 'file',
            dirpath: '/testdir'
        };
        spyOn(FilebrowserService, 'setSelectedFile');
        ctrl.openDirectory(file);
        expect(FilebrowserService.setSelectedFile).toHaveBeenCalledWith(file);
    });

    it('openDirectory changes directory if type is directory',function() {
        var dir = {
            filepath:'/testdir/test2',
            is_directory:false,
            type: 'dir',
            dirpath: '/testdir'
        };
        spyOn(FilebrowserService, 'setSelectedFile');
        spyOn(FilebrowserService, 'setCwd');
        ctrl.openDirectory(dir);
        expect(FilebrowserService.setSelectedFile).toHaveBeenCalled();
        expect(FilebrowserService.setCwd).toHaveBeenCalledWith(dir.filepath);
    });

  });

  describe('directory actions: create', function() {
    var $uibModal;

    beforeEach(inject(function(_$uibModal_) {
      $uibModal = _$uibModal_;

      var mockModal = {
        result: {
          then: function(confirmCallback, cancelCallback) {
            this.confirmCallback = confirmCallback;
            this.cancelCallback = cancelCallback;
          }
        },
        close: function() {
            this.result.confirmCallback('Untitled');
        },
        dismiss: function() {
          this.result.cancelCallback();
        }
      };

      var newFileName = 'filename';
      spyOn($uibModal,'open').and.callFake(function() {
        return mockModal;
      });

      // Select volume

      var volume = {
        available: '11G',
        filepath: '/volume1/test/path',
        size: '18G',
        type: 'volume',
        used: '6.0G',
        used_pct: 36
      };
      spyOn(FilesystemService,'getDirectoryDetails').and.callFake(function() {
        return mockResolve(volume);
      });
      spyOn(FilesystemService,'createFilewatcher').and.callFake(function() {
        return mockResolve();
      });
      FilebrowserService.setVolume(volume);
      $rootScope.$digest();
    }));

    it('creates a new file selects it',function() {
        var filepath = '/volume1/test/path/Untitled';

        spyOn(FilesystemService, 'createFile').and.callFake(function() {
            return mockResolve(filepath);
        });
        spyOn(FilebrowserService, 'setSelectedFile');
        ctrl.create('file');
        ctrl.createModalInstance.close();
        $rootScope.$digest();
        expect(FilebrowserService.setSelectedFile).toHaveBeenCalled();
    });

    it('creates a new directory and selects it',function() {
        var filepath = '/volume1/test/path/Untitled';

        spyOn(FilesystemService, 'createDirectory').and.callFake(function() {
            return mockResolve(filepath);
        });
        spyOn(FilebrowserService, 'setSelectedFile');
        ctrl.create('directory');
        ctrl.createModalInstance.close();
        $rootScope.$digest();
        expect(FilebrowserService.setSelectedFile).toHaveBeenCalled();
    });

  });

});
