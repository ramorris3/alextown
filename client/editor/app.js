var app = angular.module('EditorApp', [ui.router])

.config(function($stateProvider, $urlRouterProvider) {

  $urlRouterProvider.otherwise('/level');

  $stateProvider
    .state('level', {
      url: '/level',
      templateUrl: 'components/levels.html'
    });
});