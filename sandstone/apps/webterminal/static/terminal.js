'use strict';

angular.module('sandstone.terminal', [])

.config(['$stateProvider', '$urlRouterProvider' ,function($stateProvider, $urlRouterProvider){
  $stateProvider
    .state('terminal', {
      url: '/terminal',
      templateUrl: 'static/terminal/terminal.html',
      controller: 'TerminalCtrl'
    });
}])

.controller('TerminalCtrl', ['$scope','$window','$log','getUrlPrefix', function($scope,$window,$log,getUrlPrefix) {
  var self = $scope;
  self.terminal = {
    ws: undefined,
    term: undefined
  };

  self.startTerminal = function() {
    var protocol = (window.location.protocol.indexOf("https") === 0) ? "wss" : "ws";
    var ws_url = protocol+"://"+window.location.host+ getUrlPrefix() +"/terminal/a/term";
    var element = document.getElementById("terminal-pane");

    var rows = Math.max(2, Math.floor(element.offsetHeight/15)-1);
    var cols = Math.max(3, Math.floor(element.offsetWidth/7)-1);

    self.terminal.ws = new WebSocket(ws_url);
    self.terminal.term = new Terminal({
      cols: cols,
      rows: rows,
      screenKeys: true,
      useStyle: true
    });
    self.terminal.ws.onopen = function(event) {
      self.terminal.ws.send(JSON.stringify(["set_size", rows, cols, window.innerHeight, window.innerWidth]));
      self.terminal.term.on('data', function(data) {
        self.terminal.ws.send(JSON.stringify(['stdin', data]));
      });

      self.terminal.term.on('title', function(title) {
        document.title = title;
      });

      self.terminal.term.open(element);

      self.terminal.ws.onmessage = function(event) {
        var json_msg = JSON.parse(event.data);
        switch(json_msg[0]) {
          case "stdout":
            self.terminal.term.write(json_msg[1]);
            break;
          case "disconnect":
            self.terminal.term.write("\r\n\r\n[Finished... Terminado]\r\n");
            // Restart terminal upon shutdown
            self.startTerminal();
            break;
        }
      };
    };
  };
  self.startTerminal();
  // $window.onbeforeunload = function (term) { term.destroy() };
}]);
