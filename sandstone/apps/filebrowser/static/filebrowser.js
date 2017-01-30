'use strict';

angular.module('sandstone.filebrowser', ['smart-table', 'angularFileUpload', 'ui.router'])

.config(['$stateProvider', '$urlRouterProvider' ,function($stateProvider, $urlRouterProvider){
  $stateProvider.state('filebrowser', {
    url: '/filebrowser',
    views: {
      '': {
        templateUrl: '/static/filebrowser/filebrowser.html'
      },
      'filetree@filebrowser': {
        templateUrl: '/static/filebrowser/templates/filetree.html',
        controller: 'FiletreeCtrl as ctrl'
      },
      'details@filebrowser': {
        templateUrl: '/static/filebrowser/templates/details.html',
        controller: 'DetailsCtrl as ctrl'
      }
    }
  });
}]);
