var app = angular.module('EditorApp', ['ui.router'])

.config(function($stateProvider, $urlRouterProvider) {

  $urlRouterProvider.otherwise('/level');

  $stateProvider
    .state('level', {
      url: '/level',
      templateUrl: 'components/level-editor/levels.html',
      controller: 'LevelController'
    })
    .state('enemy', {
      url: '/enemy',
      templateUrl: 'components/enemy-editor/enemies.html',
      controller: 'EnemyController'
    });
});