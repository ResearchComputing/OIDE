'use strict';

describe('sandstone.filebrowser.UploadModalInstanceCtrl', function() {
  var FilesystemService;
  var FileUploader;
  var $controller;
  var $scope;

  beforeEach(module('sandstone'));
  beforeEach(module('ui.bootstrap'));
  beforeEach(module('sandstone.filesystemservice'));
  beforeEach(module('sandstone.filebrowser'));

  beforeEach(inject(function(_$controller_,_$rootScope_,_FilesystemService_,_FileUploader_) {
    FilesystemService = _FilesystemService_;
    FileUploader = _FileUploader_;
    $controller = _$controller_;
    $scope = _$rootScope_.$new();
  }));

  it('sets upload directory',function() {
    var ctrl;
    var dir = {'filepath': '/volume1/test/'};

    ctrl = $controller('UploadModalInstanceCtrl', {
      $scope:$scope,
      FilesystemService: FilesystemService,
      $uibModalInstance: {},
      FileUploader: FileUploader,
      directory: dir
    });

    expect(ctrl.dirpath).toBe(dir.filepath);
  });

});
