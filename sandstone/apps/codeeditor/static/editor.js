'use strict';

angular.module('sandstone.editor', ['ui.ace','treeControl'])
.run(
    function initializeServices(EditorService) {
        //Initializes the services
        // Dummy Method
    }
)
.config(['$stateProvider', '$urlRouterProvider', '$provide', function($stateProvider, $urlRouterProvider, $provide){
  $stateProvider
    .state('editor', {
      url: '/editor',
      views: {
        '': {
          templateUrl: '/static/editor/editor.html'
        },
        'ace@editor': {
          templateUrl: '/static/editor/templates/ace.html',
          controller: 'AceCtrl as ctrl'
          // resolve: {
          //   stateLoaded: function(StateService) {
          //     return StateService.stateLoaded;
          //   }
          // }
        },
        'tabs@editor': {
          templateUrl: '/static/editor/templates/tabs.html',
          controller: 'EditorTabsCtrl as ctrl'
        },
        'settings@editor': {
          templateUrl: '/static/editor/templates/settings.html',
          controller: 'EditorSettingsCtrl as ctrl'
        },
        'filetree@editor': {
          templateUrl: '/static/editor/templates/filetree.html',
          controller: 'FiletreeCtrl as ctrl'
        }
      }
    });
    $provide.provider('editorService', function() {
        this.$get = ['EditorService', 'FilebrowserAPIService', function(EditorService, FilebrowserAPIService) {
            FilebrowserAPIService.registerFilebrowserAction({
                id: 'editor:openDocument',
                description: 'Open Document in Editor',
                callback: function(filepath) {
                    window.location = '#/editor';
                    EditorService.openDocument(filepath);
                }
            });
        }];
    });
}]);
