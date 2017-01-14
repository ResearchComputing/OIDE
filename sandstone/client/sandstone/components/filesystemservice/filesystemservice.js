'use strict';

angular.module('sandstone.filesystemservice', [])

.service('FilesystemService', ['$http', '$log',function($http, $log){
  var self = this;
  // Private
  var _fsUrl = '/a/filesystem/';
  var _watcherUrl = '/a/filesystem/watchers/';
  var _fsDirUrl = '/a/filesystem/directories/';
  var _fsFileUrl = '/a/filesystem/files/';

  var _error = function(data,status) {
    var errMsg = "Error " + status + ":\n\n" + data;
    $log.error(errMsg);
    throw errMsg;
  };

  // FS object constructors
  self.Volume = function(filepath,size,used,available,usedPercent) {
    var filepathRegex = /^(\/(?:[^\/]+\/)*)+([^\/]+)[\/]?$/;
    var filepathMatches = filepath.match(filepathRegex);

    if (filepathMatches === null) {
      var errMsg = "Invalid filepath specified: " + filepath;
      throw errMsg;
    }

    this.type = 'volume';
    this.filepath = filepathMatches[0];
    this.dirpath = filepathMatches[1];
    this.name = filepathMatches[2];
    this.size = size;
    this.used = used;
    this.available = available;
    this.usedPercent = usedPercent;
  };

  self.Filesystem = function(availableGroups,volumes) {
    this.type = 'filesystem';
    this.groups = availableGroups;
    this.volumes = [];
    for (var i=0;i<volumes.length;i++) {
      var v = volumes[i];
      var volume = new self.Volume(
        v.filepath,
        v.size,
        v.used,
        v.available,
        v.used_pct
      );
      this.volumes.push(volume);
    }
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
    var requestUrl = _fsFileUrl;

    var req = $http({
      url: requestUrl,
      method: 'POST',
      params: {
        _xsrf: getCookie('_xsrf'),
        filepath: filepath
      }
    });
    req.success(function(data) {
      success(data.uri);
    });
    req.error(function(data,status) {
      err(data,status);
    });
  };

  // Directory methods
  self.getDirectoryDetails = function(filepath,config,success,error) {
    var contents = config.contents || true;
    var dirSizes = config.dirSizes || false;
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

  self.createDirectory = function(filepath,success,error) {
    var err = error || _error;
    var requestUrl = _fsDirUrl;

    var req = $http({
      url: requestUrl,
      method: 'POST',
      params: {
        _xsrf: getCookie('_xsrf'),
        filepath: filepath
      }
    });
    req.success(function(data) {
      success(data.uri);
    });
    req.error(function(data,status) {
      err(data,status);
    });
  };

  // self.createUntitledDirectory = function(dirpath,success,error) {
  //   var err = error || _error;
  //   var requestUrl = _fsDirUrl;
  //
  //   var req = $http({
  //     url: requestUrl,
  //     method: 'POST',
  //     params: {
  //       _xsrf: getCookie('_xsrf'),
  //       filepath: filepath
  //     }
  //   });
  // }

  // General methods
  self.delete = function(filepath,success,error) {
    var err = error || _error;
    var requestUrl = _fsFileUrl + encodeURIComponent(filepath) + '/';

    var req = $http({
      url: requestUrl,
      method: 'DELETE',
      params: {
        _xsrf: getCookie('_xsrf')
      }
    });
    req.success(function(data) {
      success();
    });
    req.error(function(data,status) {
      err(data,status);
    });
  };

  self.changeGroup = function(filepath,newGroup,success,error) {
    var err = error || _error;
    var requestUrl = _fsFileUrl + encodeURIComponent(filepath) + '/';

    var req = $http({
      url: requestUrl,
      method: 'PUT',
      params: {
        _xsrf: getCookie('_xsrf'),
        action: {
          action: 'change_group',
          group: newGroup
        }
      }
    });
    req.success(function(data) {
      success();
    });
    req.error(function(data,status) {
      err(data,status);
    });
  };

  self.changePermissions = function(filepath,newPermissions,success,error) {
    var err = error || _error;
    var requestUrl = _fsFileUrl + encodeURIComponent(filepath) + '/';

    var req = $http({
      url: requestUrl,
      method: 'PUT',
      params: {
        _xsrf: getCookie('_xsrf'),
        action: {
          action: 'change_permissions',
          permissions: newPermissions
        }
      }
    });
    req.success(function(data) {
      success();
    });
    req.error(function(data,status) {
      err(data,status);
    });
  };

  self.rename = function(filepath,newName,success,error) {
    var err = error || _error;
    var requestUrl = _fsUrl;

    var req = $http({
      url: requestUrl,
      method: 'PUT',
      params: {
        _xsrf: getCookie('_xsrf'),
        filepath: filepath,
        action: {
          action: 'rename',
          newname: newName
        }
      }
    });
    req.success(function(data) {
      success(data.uri);
    });
    req.error(function(data,status) {
      err(data,status);
    });
  };

  self.move = function(filepath,newPath,success,error) {
    var err = error || _error;
    var requestUrl = _fsUrl;

    var req = $http({
      url: requestUrl,
      method: 'PUT',
      params: {
        _xsrf: getCookie('_xsrf'),
        filepath: filepath,
        action: {
          action: 'move',
          newpath: newPath
        }
      }
    });
    req.success(function(data) {
      success(data.uri);
    });
    req.error(function(data,status) {
      err(data,status);
    });
  };

  self.copy = function(filepath,copyPath,success,error) {
    var err = error || _error;
    var requestUrl = _fsUrl;

    var req = $http({
      url: requestUrl,
      method: 'PUT',
      params: {
        _xsrf: getCookie('_xsrf'),
        filepath: filepath,
        action: {
          action: 'copy',
          copypath: copyPath
        }
      }
    });
    req.success(function(data) {
      success(data.uri);
    });
    req.error(function(data,status) {
      err(data,status);
    });
  };

  self.createFilewatcher = function(filepath,success,error) {
    var err = error || _error;
    var requestUrl = _watcherUrl;

    var req = $http({
      url: requestUrl,
      method: 'POST',
      params: {
        _xsrf: getCookie('_xsrf'),
        filepath: filepath
      }
    });
    req.success(function(data) {
      success();
    });
    req.error(function(data,status) {
      err(data,status);
    });
  };

  self.deleteFilewatcher = function(filepath,success,error) {
    var err = error || _error;
    var requestUrl = _watcherUrl + encodeURIComponent(filepath) + '/';

    var req = $http({
      url: requestUrl,
      method: 'DELETE',
      params: {
        _xsrf: getCookie('_xsrf')
      }
    });
    req.success(function(data) {
      success();
    });
    req.error(function(data,status) {
      err(data,status);
    });
  };

}]);
