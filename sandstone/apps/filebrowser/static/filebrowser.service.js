'use strict';

angular.module('sandstone.filebrowser')

.service('FilebrowserService', ['$rootScope', 'FilesystemService', function($rootScope,FilesystemService){
  var self = this;

  // Selection Info
  var selectionInfo = {
    cwd: undefined,
    selectedFile: undefined,
    volume: undefined
  };

  self.getSelection = function() {
    return selectionInfo;
  };
  self.setSelection = function(selection) {
    var cwd = selection.cwd || undefined;
    var selectedFile = selection.selectedFile || undefined;
    selectionInfo.cwd = cwd;
    // Load contents for CWD
    var cwdDetails = FilesystemService.getDirectoryDetails(
      cwd.filepath,
      {
        contents: true
      }
    );
    cwdDetails.then(function(dirDetails) {
      angular.extend(selectionInfo.cwd,dirDetails);
    });

    selectionInfo.selectedFile = selectedFile;
    if (selectedFile) {
      selectionInfo.volume = self.getVolumeFromPath(selectedFile.filepath);
    } else if (cwd) {
      selectionInfo.volume = self.getVolumeFromPath(cwd.filepath);
    } else {
      selectionInfo.volume = undefined;
    }
  };

  // Breadcrumbs
  var breadcrumbs = [];
  self.getBreadcrumbs = function() {
    return breadcrumbs;
  };

  var populateBreadcrumbs = function() {
    var newCrumbs = [];
    if (!selectionInfo.volume) {
      breadcrumbs = newCrumbs;
      return;
    }
    var volPath = FilesystemService.normalize(selectionInfo.volume.filepath);
    var cwdPath = FilesystemService.normalize(selectionInfo.cwd.filepath);
    var crumbPath = FilesystemService.normalize(cwdPath.replace(volPath,''));
    newCrumbs.push(selectionInfo.volume);
    if (crumbPath.length === 0) {
      breadcrumbs = newCrumbs;
      return;
    }
    crumbCmps = FilesystemService.split(crumbPath).slice(1);
    var path = volPath;

    crumbCmps.forEach(function(val,i,cmps) {
      path = FilesystemService.join(path,val);
      var partial = {
        filepath: path,
        name: val
      };
      newCrumbs.push(partial);
      FilesystemService
        .getFileDetails(partial.filepath)
        .then(function(file) {
          angular.extend(partial,file);
        });
    });
    breadcrumbs = newCrumbs;
  };

  $rootScope.$watch(function() {
      return self.getSelection();
    },function(newValue) {
      populateBreadcrumbs();
    },true);

  // Volume and Filesystem
  var filesystem = {};

  self.getFilesystem = function() {
    return filesystem;
  };

  var fsDetails = FilesystemService.getFilesystemDetails();
  fsDetails.then(
    function(filesystemDetails) {
      filesystem = filesystemDetails;
    }
  );

  self.getVolumeFromPath = function(filepath) {
    if (!filesystem.hasOwnProperty('volumes')) {
      return;
    }
    var volumes = filesystem.volumes;
    var match;
    for (var i=0;i<volumes.length;i++) {
      if (filepath.startsWith(volumes[i].filepath)) {
        if (!match) {
          match = volumes[i];
        } else if (match && (volumes[i].filepath.length > match.filepath.length)) {
          match = volumes[i];
        }
      }
    }
    return match;
  };


}]);
