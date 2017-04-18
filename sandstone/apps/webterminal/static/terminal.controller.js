'use strict';

angular.module('sandstone.terminal')

.controller('TerminalCtrl', ['$scope','$window','$log','TerminalService', function($scope,$window,$log,TerminalService) {
  var self = this;

  TerminalService.startTerminal();
}]);
