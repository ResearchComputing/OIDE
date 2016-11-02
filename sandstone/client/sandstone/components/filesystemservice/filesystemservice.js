'use strict';

angular.module('sandstone.filesystemservice', [])

.service('FilesystemService', ['$http', '$log',function($http, $log){
  var self = this;
  // Private
  var _fsUrl = '/a/filesystem/';
  var _fsDirUrl = '/a/filesystem/directories/';
  var _fsFileUrl = '/a/filesystem/files/';

  var _error = function(data,status) {
    var errMsg = "Error " + status + ":\n\n" + data;
    $log.error(errMsg);
    throw errMsg;
  };

  // FS object constructors
  self.Filesystem = function(availableGroups,volumes) {
    this.type = 'filesystem';
    this.groups = availableGroups;
    this.volumes = volumes;
  };

  self.File = function(type,filepath,owner,group,permissions,size,contents) {
    var filepathRegex = /^(\/(?:[^\/]+\/)*)+([^\/]+)[\/]?$/;
    var filepathMatches = filepath.match(filepathRegex);

    if (filepathMatches === null) {
      var errMsg = "Invalid filepath specified: " + filepath;
      throw errMsg;
    }

    this.type = type;
    this.filepath = filepathMatches[0];
    this.dirpath = filepathMatches[1];
    this.name = filepathMatches[2];
    this.owner = owner;
    this.group = group;
    this.permissions = permissions;
    this.size = size;
    if (contents) {
      this.contents = contents;
    }
  };

  // Filesystem methods
  self.getFilesystemDetails = function(success,error) {
    var err = error || _error;

    var req = $http.get(_fsUrl);
    req.success(function(data) {
      var fsDetails = new self.Filesystem(
        data.groups,
        data.volumes
      );
      success(fsDetails);
    });
    req.error(function(data, status) {
      err(data, status);
    });
  };

  // File methods
  self.getFileDetails = function(filepath,success,error) {
    var err = error || _error;
    var requestUrl = _fsFileUrl + encodeURIComponent(filepath) + '/';

    var req = $http.get(requestUrl);
    req.success(function(data) {
      var fileDetails = new self.File(
        data.type,
        data.filepath,
        data.owner,
        data.group,
        data.permissions,
        data.size
      );
      success(fileDetails);
    });
    req.error(function(data,status) {
      err(data, status);
    });
  };

  self.getFileContents = function(filepath,success,error) {
    var err = error || _error;
    var requestUrl = _fsFileUrl + encodeURIComponent(filepath) + '/contents/';

    var req = $http.get(requestUrl);
    req.success(function(data) {
      success(data.contents);
    });
    req.error(function(data,status) {
      err(data, status);
    });
  };

  self.createFile = function(filepath,success,error) {
    var err = error || _error;
    var requestUrl = _fsFileUrl + encodeURIComponent(filepath) + '/';

    var req = $http({
      url: requestUrl,
      method: 'POST',
      params: {
        _xsrf: getCookie('_xsrf')
      }
    });
    req.success(function(data) {
      success(data.msg);
    });
    req.error(function(data,status) {
      err(data,status);
    });
  };

  // Directory methods
  self.getDirectoryDetails = function(filepath,contents,dirSizes,success,error) {
    var contents = contents || true;
    var dirSizes = dirSizes || false;
    var err = error || _error;
    var requestUrl = _fsDirUrl + encodeURIComponent(filepath) + '/';

    var req = $http.get(
      requestUrl,
      {
        params: {
          contents: contents,
          dir_sizes: dirSizes
        }
      });
    req.success(function(data) {
      var directory = new self.File(
        data.type,
        data.filepath,
        data.owner,
        data.group,
        data.permissions,
        data.size
      );

      if (data.contents) {
        var contents = [];
        for (var i=0;i<data.contents.length;i++) {
          var f = data.contents[i];
          var file = new self.File(
            f.type,
            f.filepath,
            f.owner,
            f.group,
            f.permissions,
            f.size
          );
          contents.push(file);
        }
        directory.contents = contents;
      }
      
      success(directory);
    });
    req.error(function(data,status) {
      err(data,status);
    });
  };

  self.createDirectory = function(filepath,callback) {};

  // General methods
  self.delete = function(file,callback) {};

  self.changeGroup = function(file,newGroup,callback) {};

  self.changePermissions = function(file,newPermissions,callback) {};

  self.rename = function(file,newName,callback) {};

  self.move = function(file,newPath,callback) {};

  self.copy = function(file,copyPath,callback) {};


  return {
    // Get all files for a particular node
    getFiles: function(node, callback) {
      $http
        .get('/filebrowser/filetree/a/dir', {
          params: {
            dirpath: node.filepath
          }
        })
        .success(function(data, status, headers, config){
          callback(data, status, headers, config, node);
        })
        .error(function(data, status, headers, config){
          $log.error('Failed to get files');
        });
    },
    // Get all the folders for a particular node
    getFolders: function(node, callback) {
      $http
        .get('/filebrowser/filetree/a/dir', {
          params: {
            dirpath: node.filepath,
            folders: 'true'
          }
        })
        .success(function(data, status, headers, config){
          callback(data, status, headers, config, node);
        })
        .error(function(data, status, headers, config){
          $log.error('Failed to get folders');
        });
    },
    // Returns the name of the next untitled file on filesystem
    getNextUntitledFile: function(selectedDir, callback) {
      $http
        .get(
          '/filebrowser/a/fileutil', {
            params: {
              dirpath: selectedDir,
              operation: 'GET_NEXT_UNTITLED_FILE'
            }
        })
        .success(function(data, status, headers, config){
          callback(data, status, headers, config);
        });
    },
    // Creates a new file on the filesystem
    createNewFile: function(newFilePath, callback){
      $http({
        url: '/filebrowser/localfiles'+newFilePath,
        method: 'POST',
        // headers : {'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8'},
        params: {_xsrf:getCookie('_xsrf')}
        })
        .success(function (data, status, headers, config) {
          callback(data, status, headers, config);
        })
    },
    // Rename a file on the filesystem
    renameFile: function(newFilename, node, callback) {
      $http({
        url: '/filebrowser/a/fileutil',
        method: 'POST',
        params: {
          _xsrf:getCookie('_xsrf'),
          operation: 'RENAME',
          filepath: node.filepath,
          newFileName: newFilename
        }
        })
        .success(function(data, status, headers, config){
          callback(data, status, headers, config, node);
        });
    },
    // Paste file
    pasteFile: function(originalPath, newPath, callback) {
      $http({
        url: '/filebrowser/a/fileutil',
        method: 'POST',
        params: {
          _xsrf:getCookie('_xsrf'),
          operation: 'COPY',
          origpath: originalPath,
          newpath: newPath
        }
        })
        .success(function(data, status, headers, config){
          callback(data, status, headers, config);
        });
    },
    // Deleting files from the filesystem
    deleteFile: function(filepath, callback) {
      $http({
        url: '/filebrowser/localfiles'+filepath,
        method: 'DELETE',
        params: {
          _xsrf:getCookie('_xsrf')
          }
        })
        .success(function(data, status, headers, config){
          callback(data, status, headers, config);
        });
    },
    // Get the next duplicate from the filesystem
    getNextDuplicate: function(selectedFile, callback) {
      $http
        .get(
          '/filebrowser/a/fileutil', {
            params: {
              filepath: selectedFile,
              operation: 'GET_NEXT_DUPLICATE'
            }
        })
        .success(function(data, status, headers, config){
          data.originalFile = selectedFile;
          callback(data, status, headers, config);
        });
    },
    // Duplicate File
    duplicateFile: function(selectedFile, newFilePath, callback) {
      $http({
        url: '/filebrowser/a/fileutil',
        method: 'POST',
        params: {
          _xsrf:getCookie('_xsrf'),
          operation: 'COPY',
          origpath: selectedFile,
          newpath: newFilePath
        }
        })
        .success(function(data, status, headers, config){
          callback(data, status, headers, config);
        });
    },
    // Get next untitled directory
    getNextUntitledDir: function(selectedDir, callback) {
      $http
        .get(
          '/filebrowser/a/fileutil', {
            params: {
              dirpath: selectedDir,
              operation: 'GET_NEXT_UNTITLED_DIR'
            }
        })
        .success(function(data, status, headers, config){
          callback(data, status, headers, config);
        });
    },
    // Create new directory
    createNewDir: function(newDirPath, callback) {
      $http({
        url: '/filebrowser/localfiles'+newDirPath,
        method: 'POST',
        // headers : {'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8'},
        params: {
          _xsrf:getCookie('_xsrf'),
          isDir: true
        }
        })
        .success(function(data, status, headers, config){
          callback(data, status, headers, config);
        });
    },
    // Change Permissions
    changePermissions: function(filepath, permissionString, callback) {
      $http({
        url: '/filebrowser/a/fileutil',
        method: 'POST',
        params: {
          _xsrf:getCookie('_xsrf'),
          operation: 'CHANGE_PERMISSIONS',
          permissions: permissionString,
          filepath: filepath
        }
      })
      .success(function(data, status, headers, config){
        callback(data, status, headers, config);
      });
    },
    // Get List of Groups
    getGroups: function(callback) {
      $http({
        url: '/filebrowser/a/fileutil',
        method: 'GET',
        params: {
          _xsrf:getCookie('_xsrf'),
          operation: 'GET_GROUPS',
        }
      })
      .success(function(data, status, headers, config){
        callback(data, status, headers, config);
      });
    },
    // Change Group
    changeGroup: function(filepath, group, callback) {
      $http({
        url: '/filebrowser/a/fileutil',
        method: 'POST',
        params: {
          _xsrf:getCookie('_xsrf'),
          operation: 'CHANGE_GROUP',
          filepath: filepath,
          group: group
        }
      })
      .success(function(data, status, headers, config){
        callback(data, status, headers, config);
      });
    },
    // Get Root Directory for given filepath
    getRootDirectory: function(filepath, callback) {
      $http({
        url: '/filebrowser/a/fileutil',
        method: 'GET',
        params: {
          _xsrf:getCookie('_xsrf'),
          operation: 'GET_ROOT_DIR',
          filepath: filepath
        }
      })
      .success(function(data, status, headers, config){
        callback(data, status, headers, config);
      });
    },
    // Get Volume Info
    getVolumeInfo: function(filepath, callback) {
      $http({
        url: '/filebrowser/a/fileutil',
        method: 'GET',
        params: {
          _xsrf:getCookie('_xsrf'),
          operation: 'GET_VOLUME_INFO',
          filepath: filepath
        }
      })
      .success(function(data, status, headers, config){
        callback(data, status, headers, config);
      });
    }
  };
}]);
