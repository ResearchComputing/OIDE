'use strict';

angular.module('sandstone.states', [])
.factory('StateService', ['$http', '$window', '$log', function($http,$window,$log) {
  var state = {};
  var storeState = function () {
    $http({
      url: '/a/state',
      method: 'POST',
      xsrfHeaderName: 'X-XSRFToken',
      xsrfCookieName: '_xsrf',
      data: JSON.stringify(state)
    })
    .success(function (data, status, headers, config) {
      $log.debug('Stored state for user.');
    })
    .error(function (data, status, headers, config) {
      $log.error('Failed to store state for user.');
    });
  };
  var initializeState = function () {
    return $http
      .get('/a/state')
      .success(function (data, status, headers, config) {
        $log.debug('Retrieved state for user: ', data);
        state = data.state;
        return true;
      })
      .error(function (data, status, headers, config) {
        $log.error('Failed to retrieve state for user.');
        return false;
      });
  };
  var stateLoaded = initializeState();
  $window.onbeforeunload = storeState;
  return {
    stateLoaded: stateLoaded,
    getKey: function(key) {
      if (state&&(key in state)) {
        return state[key];
      } else {
        return undefined;
      }
    },
    setKey: function(key,value) {
      state[key] = value;
      return true;
    }
  };
}]);
