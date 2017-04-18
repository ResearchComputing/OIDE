'use strict';

angular.module('sandstone.terminal', [])

.config(['$stateProvider', '$urlRouterProvider' ,function($stateProvider, $urlRouterProvider){
  $stateProvider
    .state('terminal', {
      url: '/terminal',
      templateUrl: '/static/terminal/terminal.html',
      controller: 'TerminalCtrl',
      controllerAs: 'ctrl'
    });
}]);
