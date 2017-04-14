'use strict';

angular.module('sandstone.filebrowser')

.service('FilebrowserService', ['$rootScope', 'FilesystemService', 'AlertService', function($rootScope,FilesystemService,AlertService){
  var self = this;

  // Selection Info
  var selectionInfo = {
    // Current Working Directory
    cwd: undefined,
    // Currently selected file
    selectedFile: undefined,
    // Currently selected volume (defined by cwd)
    volume: undefined
  };

  self.getSelection = function() {
    return selectionInfo;
  };

  self.setSelectedFile = function(selectedFile) {
    var file = selectedFile || undefined;
    selectionInfo.selectedFile = file;
  };

  self.setCwd = function(filepath) {
    // Load contents for CWD
    var cwdDetails = FilesystemService.getDirectoryDetails(
      filepath,
      {
        contents: true
      }
    );
    cwdDetails.then(function(dirDetails) {
      // Update filewatchers, if the CWD has changed
      var newPath = FilesystemService.normalize(dirDetails.filepath);
      FilesystemService.createFilewatcher(newPath);
      // Update directory
      selectionInfo.cwd = dirDetails;
    },
    function(data) {
      AlertService.addAlert({
        type: 'warning',
        message: 'Failed to retrieve directory contents for ' + filepath
      });
    });
  };

  self.setVolume = function(volume) {
    selectionInfo.volume = volume;
    self.setCwd(volume.filepath);
  };

  // Volume and Filesystem
  var filesystem = {};

  self.getFilesystem = function() {
    return filesystem;
  };

  var fsDetails = FilesystemService.getFilesystemDetails();
  fsDetails.then(function(filesystemDetails) {
    filesystem = filesystemDetails;
  },
  function(data) {
    AlertService.addAlert({
      type: 'danger',
      message: 'Failed to retrieve filesystem details. Please refresh this page.',
      close: false
    });
  });

  // Filewatcher updates
  $rootScope.$on('filesystem:file_created', function(event,data) {
    var dirpath = FilesystemService.normalize(data.dirpath);
    var cwdPath = FilesystemService.normalize(selectionInfo.cwd.filepath);

    if(dirpath === cwdPath) {
      self.setCwd(cwdPath);
    }
  });

  $rootScope.$on('filesystem:file_deleted', function(event,data) {
    var filepath = FilesystemService.normalize(data.filepath);
    var dirpath = FilesystemService.normalize(data.dirpath);
    var cwdPath = FilesystemService.normalize(selectionInfo.cwd.filepath);
    var selPath = FilesystemService.normalize(selectionInfo.selectedFile.filepath);

    if(data.is_directory && (filepath === cwdPath)) {
      // CWD deleted, change cwd to selected volume
      self.changeDirectory(selectionInfo.volume.filepath);
    } else {
      if(dirpath === cwdPath) {
        // Contents of CWD have changed, update them
        self.setCwd(cwdPath);
      }
      if(filepath === selPath) {
        // Currently selected file deleted, deselect
        self.setSelectedFile();
      }
    }
  });

  $rootScope.$on('filesystem:file_moved', function(event,data) {
    var srcDir = FilesystemService.normalize(data.src_dirpath);
    var destDir = FilesystemService.normalize(data.dest_dirpath);
    var cwdPath = FilesystemService.normalize(selectionInfo.cwd.filepath);
    if ((srcDir === cwdPath) || (destDir === cwdPath)) {
      // CWD contents have changed, update them
      self.setCwd(cwdPath);
    }

    var srcPath = FilesystemService.normalize(data.src_filepath);
    var selPath = FilesystemService.normalize(selectionInfo.selectedFile.filepath);
    if(srcPath === selPath) {
      // Selected file has moved, deselect
      self.setSelectedFile();
    }
  });

}]);
