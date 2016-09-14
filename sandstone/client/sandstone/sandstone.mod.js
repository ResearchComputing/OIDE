function getSandstoneModule(depList) {
  return angular.module('sandstone', depList)
    .config(['$urlRouterProvider', function($urlRouterProvider) {
      $urlRouterProvider.otherwise('/editor');
    }])
    .run(function(BroadcastService) {
        // Loads the BroadcastService
    })
    .controller('PageCtrl', ['$location','PageService',function($location,PageService) {
      var self = this;
      self.currentUrl = PageService.getCurrentUrl;
    }])
    .factory('PageService', ['$location',function($location) {
      return {
        getCurrentUrl: function () {
          return '/#'+$location.path();
        }
      };
    }]);
}
