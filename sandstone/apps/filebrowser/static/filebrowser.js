'use strict';
/**
 * Filebrowser
 * @namespace Filebrowser
 */
angular.module('sandstone.filebrowser', ['smart-table', 'angularFileUpload', 'ui.router'])

.config(['$stateProvider', '$urlRouterProvider' ,function($stateProvider, $urlRouterProvider){
  $stateProvider.state('filebrowser', {
    url: '/filebrowser',
    views: {
      '': {
        templateUrl: '/static/filebrowser/filebrowser.html',
        controller: 'FilebrowserController',
        controllerAs: 'ctrl'
      }//,
      // 'filetree@filebrowser': {
      //   templateUrl: '/static/filebrowser/templates/filetree.html',
      //   controller: 'FiletreeController',
      //   controllerAs: 'ctrl'
      // }
    }
  });
}]);
