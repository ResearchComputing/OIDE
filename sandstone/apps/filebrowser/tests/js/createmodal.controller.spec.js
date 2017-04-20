'use strict';

describe('sandstone.filebrowser.CreateModalInstanceCtrl', function() {
  var $controller;
  var $scope;
  var ctrl;

  var baseDirectory = {
      contents: [],
      dirpath: '/home/sandstone',
      group: 'sandstone',
      name: 'sandstone',
      owner: 'sandstone',
      permissions: 'rwxr-xr-x',
      size: '4.0K',
      type: 'directory'
  };

  var fileAction = {
      type: 'file',
      baseDirectory: baseDirectory,
      filename: 'Untitled'
  };

  var fileActionNoName = {
      type: 'dir',
      baseDirectory: baseDirectory
  };

  beforeEach(module('sandstone'));
  beforeEach(module('ui.bootstrap'));
  beforeEach(module('sandstone.filebrowser'));

  beforeEach(inject(function(_$rootScope_,_$controller_) {
    $controller = _$controller_;
    $scope = _$rootScope_.$new();
  }));

  it('sets type based on action',function() {

    ctrl = $controller('CreateModalInstanceCtrl', {
      $scope:$scope,
      $modalInstance: {},
      action: fileAction
    });
    $scope.ctrl = ctrl;
    expect($scope.ctrl.type).toBe("file");
  });

  it('sets baseDirectory from action',function() {
      ctrl = $controller('CreateModalInstanceCtrl', {
          $scope: $scope,
          $modalInstance: {},
          action: fileAction
      })
      $scope.ctrl = ctrl;
      expect($scope.ctrl.baseDirectory).toEqual(baseDirectory);
  });

  it('sets new file name to Untitled if none specified',function() {
      ctrl = $controller('CreateModalInstanceCtrl', {
          $scope: $scope,
          $modalInstance: {},
          action: fileActionNoName
      })
      $scope.ctrl = ctrl;
      expect($scope.ctrl.newFileName).toEqual('Untitled');
  });

});
