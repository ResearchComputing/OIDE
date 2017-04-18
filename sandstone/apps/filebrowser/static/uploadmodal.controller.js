'use strict';

angular.module('sandstone.filebrowser')

.controller('UploadModalInstanceCtrl', ['FilesystemService', '$modalInstance', 'FileUploader', 'directory', 'getXsrfCookie' ,function (FilesystemService, $modalInstance, FileUploader, directory, getXsrfCookie) {
  var self = this;
  self.dirpath = directory.filepath;
  var uploader = self.uploader = new FileUploader({
      autoUpload: true,
      url: '/filebrowser/a/upload',
      headers: {
        'X-XSRFToken': getXsrfCookie(),
        'basepath': self.dirpath
      }
   });

  uploader.filters.push({
    name: 'customFilter',
    fn: function(item /*{File|FileLikeObject}*/, options) {
      return this.queue.length < 10;
    }
  });

   uploader.onWhenAddingFileFailed = function(item /*{File|FileLikeObject}*/, filter, options) {
       console.log('onWhenAddingFileFailed', item, filter, options);
   };
    uploader.onAfterAddingFile = function(fileItem) {
      fileItem.headers['uploadDir'] = self.dirpath;
      console.log('onAfterAddingFile', fileItem);
    };
   uploader.onAfterAddingAll = function(addedFileItems) {
       console.log('onAfterAddingAll', addedFileItems);
   };
   uploader.onBeforeUploadItem = function(item) {
       console.log('onBeforeUploadItem', item);
   };
   uploader.onProgressItem = function(fileItem, progress) {
       console.log('onProgressItem', fileItem, progress);
   };
   uploader.onProgressAll = function(progress) {
       console.log('onProgressAll', progress);
   };
   uploader.onSuccessItem = function(fileItem, response, status, headers) {
       console.log('onSuccessItem', fileItem, response, status, headers);
   };
   uploader.onErrorItem = function(fileItem, response, status, headers) {
       console.log('onErrorItem', fileItem, response, status, headers);
   };
   uploader.onCancelItem = function(fileItem, response, status, headers) {
       console.log('onCancelItem', fileItem, response, status, headers);
   };
   uploader.onCompleteItem = function(fileItem, response, status, headers) {
       console.log('onCompleteItem', fileItem, response, status, headers);
   };
   uploader.onCompleteAll = function() {
       console.log('onCompleteAll');
   };

  self.cancel = function () {
    $modalInstance.dismiss();
  };
}]);
