'use strict';

describe('sandstone.filebrowser.VolumesCtrl', function() {
  var FilebrowserService;
  var FilesystemService;
  var ctrl;
  var $controller;
  var $scope;
  var volumeDetails, secondVolume;

  beforeEach(module('sandstone'));
  beforeEach(module('sandstone.filesystemservice'));
  beforeEach(module('sandstone.filebrowser'));

  beforeEach(inject(function(_FilesystemService_,_FilebrowserService_,_$rootScope_,_$controller_) {
    FilesystemService = _FilesystemService_;
    FilebrowserService = _FilebrowserService_;
    $controller = _$controller_;

    volumeDetails = {
      available: '11G',
      filepath: '/volume1/',
      size: '18G',
      type: 'volume',
      used: '6.0G',
      used_pct: 36
    };

    secondVolume = {
        available: '12G',
        filepath: '/volume2/',
        size: '20G',
        type: 'volume',
        used: '8.0G',
        used_pct: 40
    }

    $scope = _$rootScope_.$new();
    ctrl = $controller('VolumesCtrl', {$scope:$scope});

  }));

  it('sets new volume upon selection',function() {
      // Spy on FilebrowserService.setCwd
      spyOn(FilebrowserService, 'setCwd');
      FilebrowserService.setVolume(volumeDetails);
      // setCwd must have been called
      expect(FilebrowserService.setCwd).toHaveBeenCalled();
      expect(FilebrowserService.getSelection().volume).toBe(volumeDetails);
  });

  it('changes selected volume when selection changes',function() {
      spyOn(FilebrowserService, 'setCwd');
      // Set initial volume
      FilebrowserService.setVolume(volumeDetails);
      // Change volume
      FilebrowserService.setVolume(secondVolume);
      expect(FilebrowserService.getSelection().volume).toBe(secondVolume);
  });

});
