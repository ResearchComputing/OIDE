'use strict';

angular.module('sandstone.filebrowser')
.factory('FilebrowserAPIService', function() {
    // Stores the registered actions
    var actions = [];
    return {
        registerFilebrowserAction: function(action) {
            actions.push(action);
        },
        getActions: function() {
            return actions;
        }
    }
});
