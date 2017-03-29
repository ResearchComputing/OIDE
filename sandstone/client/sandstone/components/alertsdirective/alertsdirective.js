angular.module('sandstone.alertsdirective', [])

.directive('sandstoneAlerts', [function(){
  return {
    restrict: 'A',
    templateUrl: '/static/core/components/alertsdirective/templates/alerts.html',
    controller: ['$scope', '$element', '$rootScope', 'AlertService', function($scope, $element, $rootScope, AlertService) {
      var self = $scope;
      self.getAlerts = AlertService.getAlerts;
      self.removeAlert = AlertService.removeAlert;
    }
  ]};
}]);
