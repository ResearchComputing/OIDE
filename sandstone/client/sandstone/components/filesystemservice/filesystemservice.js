'use strict';

function getCookie(name) {
  var r = document.cookie.match("\\b" + name + "=([^;]*)\\b");
  return r ? r[1] : undefined;
};

angular.module('sandstone.filesystemservice', [])

.service('FilesystemService', ['$http', '$log',function($http, $log){

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
