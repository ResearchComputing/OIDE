'use strict';

(function() {
  getDependencies();

  function getDependencies() {
    var initInjector = angular.injector(['ng']);
    var $http = initInjector.get('$http');

    return $http.get(URLPREFIX+'/a/deps').then(function(response) {
      var depList = ['ui.router'];
      for (var i=0;i<response.data.dependencies.length;i++) {
        depList.push('sandstone.'+response.data.dependencies[i]);
      }
      depList.push('sandstone.acemodes');
      depList.push('ui.bootstrap');
      depList.push('sandstone.websocketservice');
      depList.push('sandstone.broadcastservice');
      depList.push('sandstone.filesystemservice');
      depList.push('sandstone.alertsdirective');
      depList.push('sandstone.filetreedirective');
      var sandstone = getSandstoneModule(depList);

      angular.element(document).ready(function() {
        angular.bootstrap(document, ['sandstone']);
      });
    });
  }
}());
