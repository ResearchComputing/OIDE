/** @module sandstone.BroadcastService
  * This service implements the client-side interface to the
  * Broadcast System. This service is initialized in a .run()
  * block on the sandstone root module.
  */
'use strict';

angular.module('sandstone.broadcastservice', [])
.factory('BroadcastService', ['$rootScope','WebsocketService','$location','getUrlPrefix', function($rootScope,WebsocketService,$location,getUrlPrefix) {
  var ws = null;
  var initialize = function() {
    var websocketAddress = getBroadcastUrl();
    ws = WebsocketService.connect(websocketAddress);
    ws.onmessage = function(msg) {
      var data = JSON.parse(msg.data);
      $rootScope.$emit(data.key, data.data);
    };
  };

  var getBroadcastUrl = function() {
    var protocol = 'ws'
    if($location.protocol() === 'https') {
      protocol = 'wss';
    }
    var broadcastUrl = protocol + '://' + $location.host() + ':' + $location.port() + getUrlPrefix() + '/messages';
    return broadcastUrl;
  };

  var sendMessage = function(message) {
    if(message) {
      ws.send(JSON.stringify(message));
    }
  };
  // setUpWebsocket();
  return {
    /** @function initialize
      * This function initializes the websocket connection to the Broadcast System.
      */
    initialize: initialize,
    /**
      * @function getBroadcastUrl
      * @returns {string} broadcastUrl The URL for the Broadcast System websocket.
      */
    getBroadcastUrl: getBroadcastUrl,
    /**
      * @function sendMessage
      * @param {object} The message to be broadcasted. Must have a key {string}
      * and data {object} defined.
      */
    sendMessage: sendMessage
  }
}]);
