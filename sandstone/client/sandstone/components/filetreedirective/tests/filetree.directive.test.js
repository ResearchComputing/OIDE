describe('sandstone.filetreedirective', function() {
  var baseElement = '<div sandstone-filetree tree-data="treeData" tree-options="treeOptions" on-select="treeOnSelect(node,selected)" on-toggle="treeOnToggle(node,expanded)"></div>';

  var volumeDetails = {
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
  var fileDetails = {
    type: 'file',
    filepath: '/volume1/dir1/file1',
    dirpath: '/volume1/dir1',
    name: 'file1',
    owner: 'testuser',
    group: 'testgrp',
    permissions: 'rwxrw-r--',
    size: '8.8K'
  };
  var dirDetails = {
    type: 'directory',
    filepath: '/volume1/dir1',
    dirpath: '/volume1/',
    name: 'dir1',
    owner: 'testuser',
    group: 'testgrp',
    permissions: 'rwxrw-r--',
    size: '4.0K',
    contents: [fileDetails]
  };

  beforeEach(module('sandstone'));
  beforeEach(module('sandstone.templates'));
  beforeEach(module('sandstone.filetreedirective'));
  beforeEach(module(function($provide) {
    var MockFilesystemService = function() {
      return {
        getFilesystemDetails: function(success) {
          success(fsDetails);
        },
        getDirectoryDetails: function(filepath,config,success) {
          success(dirDetails);
        },
        createFilewatcher: function(filepath,success) {
          success();
        },
        deleteFilewatcher: function(filepath,success) {
          success();
        },
        normalize: function() {}
      };
    };
    $provide.service('FilesystemService',MockFilesystemService);
  }));

  describe('controller', function() {
    var $compile, $scope, isolateScope, element, FilesystemService;

    beforeEach(inject(function(_$compile_,_$rootScope_,_FilesystemService_) {
      FilesystemService = _FilesystemService_;
      $compile = _$compile_;
      $scope = _$rootScope_.$new();
      $scope.treeData = {
        contents: [],
        selected: [],
        expanded: []
      };
      $scope.treeOptions = {
        multiSelection: true
      };
      $scope.treeOnSelect = function(node,selected){};
      $scope.treeOnToggle = function(node,expanded){};
      element = $compile(baseElement)($scope);
      $scope.$digest();
      isolateScope = element.isolateScope();
    }));

    it('populates contents upon load',function() {
      var contents = $scope.treeData.contents;
      expect(contents[0].filepath).toEqual(volumeDetails.filepath);
    });

    it('loadDirectoryContents',function() {
      var node = $scope.treeData.contents[0];
      isolateScope.loadDirectoryContents(node);
      $scope.$digest();
      var contents = isolateScope.treeData.contents;
      expect(contents.length).toEqual(1);
      expect(contents[0].children.length).toEqual(1);
      expect(contents[0].children[0].filepath).toEqual('/volume1/dir1/file1');
    });

    it('updateDirectoryContents',function() {
      var node = $scope.treeData.contents[0];
      isolateScope.loadDirectoryContents(node);
      $scope.$digest();
      // Not expanded
      spyOn(isolateScope,'loadDirectoryContents');
      isolateScope.updateDirectoryContents(dirDetails.filepath);
      expect(isolateScope.loadDirectoryContents).not.toHaveBeenCalled();
      // Expanded
      var dir = node.children[0];
      var expanded = isolateScope.treeData.expanded;
      expanded.push(dir);
      isolateScope.updateDirectoryContents(dirDetails.filepath);
      expect(isolateScope.loadDirectoryContents).toHaveBeenCalledWith(dir);
    });

    it('onSelect',function() {
      spyOn(isolateScope,'extraOnSelect');
      isolateScope.onSelect({},{});
      expect(isolateScope.extraOnSelect).toHaveBeenCalledWith({node:{},selected:{}});
    });

    it('onToggle',function() {
      var node = $scope.treeData.contents[0];

      spyOn(isolateScope,'extraOnToggle');
      spyOn(isolateScope,'loadDirectoryContents');
      spyOn(FilesystemService,'createFilewatcher');
      spyOn(FilesystemService,'deleteFilewatcher');
      isolateScope.onToggle(node,true);
      expect(isolateScope.extraOnToggle).toHaveBeenCalledWith({node:node,expanded:true});
      expect(isolateScope.loadDirectoryContents).toHaveBeenCalled();
      expect(FilesystemService.createFilewatcher).toHaveBeenCalled();
      expect(FilesystemService.deleteFilewatcher).not.toHaveBeenCalled();
      isolateScope.onToggle(node,false);
      expect(isolateScope.extraOnToggle).toHaveBeenCalledWith({node:node,expanded:false});
      expect(FilesystemService.deleteFilewatcher).toHaveBeenCalled();
    });

  });

  describe('directive', function() {
    var $compile, $scope, isolateScope, element, FilesystemService;

    var getMatchesFromTpl = function(pattern,tpl) {
      var matches = tpl.match(pattern);
      if (!matches) {
        return [];
      }
      return matches;
    };

    var renderTpl = function(scope,el) {
      var tpl;
      scope.$digest();
      tpl = el.html();
      return tpl;
    };

    beforeEach(inject(function(_$compile_,_$rootScope_,_FilesystemService_) {
      FilesystemService = _FilesystemService_;
      $compile = _$compile_;
      $scope = _$rootScope_.$new();
      $scope.treeData = {
        contents: [],
        selected: [],
        expanded: []
      };
      $scope.treeOptions = {
        multiSelection: true
      };
      $scope.treeOnSelect = function(node,selected){};
      $scope.treeOnToggle = function(node,expanded){};
      element = $compile(baseElement)($scope);
      $scope.$digest();
      isolateScope = element.isolateScope();
    }));

    it('initial tree contents load and render',function() {
      var tpl = element.html();
      expect(tpl).toContain('/volume1/');
      expect(tpl).not.toContain('dir1');
    });

    it('expand and contract node',function() {
      var contents = isolateScope.treeData.contents;
      var expanded = isolateScope.treeData.expanded;
      expanded.push(contents[0]);
      var tpl = renderTpl($scope,element);
      expect(tpl).toContain('/volume1/');
      expect(tpl).toContain('file1');
      expanded.shift();
      tpl = renderTpl($scope,element);
      expect(tpl).toContain('/volume1/');
      expect(tpl).not.toContain('file1');
    });

  });

});
