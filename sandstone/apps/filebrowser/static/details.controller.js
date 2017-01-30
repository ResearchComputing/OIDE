'use strict';

angular.module('sandstone.filebrowser')
.controller('DetailsCtrl', ['$rootScope', 'FileService', '$scope', 'FilesystemService', '$modal', 'BroadcastService', function($rootScope, FileService, $scope, FilesystemService, $modal, BroadcastService) {
  var self = this;
  
}])
.directive('syncFocusWith', function($timeout, $rootScope) {
    return {
        restrict: 'A',
        scope: {
            focusValue: "=syncFocusWith"
        },
        link: function($scope, $element, attrs) {
            $scope.$watch("focusValue", function(currentValue, previousValue) {
                if (currentValue === true && !previousValue) {
                    $element[0].focus();
                } else if (currentValue === false && previousValue) {
                    $element[0].blur();
                }
            })
        }
    }
})
.controller('DeleteModalInstanceCtrl', ['FilesystemService', '$modalInstance', 'selectedFile',function (FilesystemService, $modalInstance, selectedFile) {
  var self = this;
  self.selectedFile = selectedFile;
  self.remove = function () {
    FilesystemService.deleteFile(self.selectedFile.filepath, function(data){
      $modalInstance.close(self.selectedFile);
    });
  };

  self.cancel = function () {
    $modalInstance.dismiss('cancel');
  };
}])
.controller('UploadModalInstanceCtrl', ['FilesystemService', '$modalInstance', 'FileUploader', 'selectedDirectory',function (FilesystemService, $modalInstance, FileUploader, selectedDirectory) {
  var self = this;
  self.dirpath = selectedDirectory;
  var uploader = self.uploader = new FileUploader({
      autoUpload: true,
      url: '/supl/a/upload',
      headers: {
        'X-XSRFToken': getCookie('_xsrf'),
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
    $modalInstance.close();
  };
}]);
