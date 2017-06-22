'use strict';

angular.module('sandstone.terminal')

.service('TerminalService', ['AlertService','$q','getUrlPrefix',function(AlertService,$q,getUrlPrefix) {
  var self = this;

  self.terminal = {
    ws: undefined,
    term: undefined
  };

  var connectWebsocket = function() {
    var deferred = $q.defer();

    if(self.terminal.ws) {
      deferred.resolve();
    } else {
      var protocol = (window.location.protocol.indexOf("https") === 0) ? "wss" : "ws";
      var ws_url = protocol+"://"+window.location.host+ getUrlPrefix() +"/terminal/a/term";

      self.terminal.ws = new WebSocket(ws_url);
      self.terminal.ws.onopen = function(event) {
        deferred.resolve();
      };
      self.terminal.ws.onclose = function(event) {
        AlertService.addAlert({
          type: 'danger',
          message: 'Connection to terminal lost. This could be because you have more than 3 terminals already running.',
          close: false
        })
      }
    }
    return deferred.promise;
  };

  window.onhashchange = function() {
      if(window.location.hash !== '#/terminal') {
          self.savedTerm = self.terminal.term;
      }
  };

  var makeTerminal = function() {
    var element = document.getElementById("terminal-pane");

    var rows = Math.max(24, Math.floor(element.offsetHeight/14)-1);
    var cols = Math.max(3, Math.floor(element.offsetWidth/10)-1);


    if(self.savedTerm) {
        self.terminal.term = self.savedTerm;
    } else {
        self.terminal.term = new Terminal({
          cols: cols,
          rows: rows,
          screenKeys: true,
          useStyle: true
        });
        self.terminal.term.on('data', function(data) {
          self.terminal.ws.send(JSON.stringify(['stdin', data]));
        });

        self.terminal.term.on('title', function(title) {
          document.title = title;
        });
    }
    self.terminal.term.open(element);

    self.terminal.ws.send(JSON.stringify(["set_size", rows, cols, window.innerHeight, window.innerWidth]));

    self.terminal.ws.onmessage = function(event) {
      var json_msg = JSON.parse(event.data);
      switch(json_msg[0]) {
        case "stdout":
          self.terminal.term.write(json_msg[1]);
          break;
        case "disconnect":
          self.terminal.term.write("\r\n\r\n[Closed terminal]\r\n");
          // Restart terminal upon shutdown
          self.terminal.ws.close();
          self.terminal.ws = undefined;
          self.startTerminal();
          break;
      }
    };
  };

  self.startTerminal = function() {
    var websocketConnected = connectWebsocket();
    websocketConnected.then(function() {
      makeTerminal();
    });
  };

}]);
