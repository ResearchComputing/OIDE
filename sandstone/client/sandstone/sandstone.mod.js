function getSandstoneModule(depList) {
  return angular.module('sandstone', depList)
    .config(['$urlRouterProvider','$httpProvider', function($urlRouterProvider,$httpProvider) {
      $httpProvider.interceptors.push('XsrfInjector');
      $urlRouterProvider.otherwise('/editor');
    }])
    .run(function(BroadcastService) {
        // Loads the BroadcastService
        BroadcastService.initialize();
    })
    .factory('XsrfInjector',[function() {
      var getCookie = function(name) {
        var r = document.cookie.match("\\b" + name + "=([^;]*)\\b");
        return r ? r[1] : undefined;
      };
      return {
        request: function(config) {
          config.headers['X-XSRFToken'] = getCookie('_xsrf');
          return config;
        }
      };
    }])
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
