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
    selectionInfo.selectedFile = selectedFile;
    if (selectedFile) {
      selectionInfo.volume = getVolumeFromPath(selectedFile.filepath);
    } else if (cwd) {
      selectionInfo.volume = getVolumeFromPath(cwd.filepath);
    } else {
      selectionInfo.volume = undefined;
    }
  };

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

  var getVolumeFromPath = function(filepath) {
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
