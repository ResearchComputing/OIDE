'use strict';

describe('sandstone.filebrowser.MoveModalInstanceCtrl', function() {
  var FilesystemService;
  var $controller;
  var $scope;
  var fileDetails;
  var treeData;

  beforeEach(module('sandstone'));
  beforeEach(module('ui.bootstrap'));
  beforeEach(module('sandstone.filesystemservice'));
  beforeEach(module('sandstone.filebrowser'));

  beforeEach(inject(function(_$controller_,_$rootScope_,_FilesystemService_) {
    FilesystemService = _FilesystemService_;
    $controller = _$controller_;
    $scope = _$rootScope_.$new();

    fileDetails = {
      type: 'file',
      filepath: '/volume1/file1',
      dirpath: '/volume1',
      name: 'file1',
      owner: 'testuser',
      group: 'testgrp',
      permissions: 'rwxrw-r--',
      size: '8.8K'
    };

    treeData = {
        contents: [
            {
                type: 'volume',
                filepath: '/volume1',
                dirpath: '/',
                name: 'volume1',
                owner: 'testuser',
                group: 'testgrp',
                permissions: 'rwxrw-r--',
                size: '8.8K',
                contents: [fileDetails]
            }
        ],
        selected: [],
        expanded: []
    };

  }));

  it('starts with empty filetree data',function() {
    var ctrl;

    ctrl = $controller('MoveModalInstanceCtrl', {
      $scope:$scope,
      FilesystemService: FilesystemService,
      $modalInstance: {},
      file: fileDetails
    });

    expect(ctrl.treeData.contents.length).toBe(0);
    expect(ctrl.treeData.selected.length).toBe(0);
    expect(ctrl.treeData.expanded.length).toBe(0);

  });

  it('updates selected file attributes from filtree selection',function() {
      var ctrl = $controller('MoveModalInstanceCtrl', {
          $scope: $scope,
          FilesystemService: FilesystemService,
          $modalInstance: {},
          file: fileDetails
      });

      ctrl.treeData = treeData;

      ctrl.filetreeOnSelect(ctrl.treeData.contents[0], true);
      expect(ctrl.newFile).toBeDefined();
      expect(ctrl.newFile.dirpath).toBe('/volume1');
      expect(ctrl.newFile.name).toBe("file1");
  });

  it('correctly validates filepath',function() {
      var ctrl = $controller('MoveModalInstanceCtrl', {
          $scope: $scope,
          FilesystemService: FilesystemService,
          $modalInstance: {},
          file: fileDetails
      });

      ctrl.treeData = treeData;
      expect(ctrl.validFilepath).toBeTruthy();
  });

  it('sends valid filepath on move',function() {});

});
