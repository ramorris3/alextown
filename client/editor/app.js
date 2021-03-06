var app = angular.module('EditorApp', ['ui.router'])

// ui-router configuration
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
    })
    .state('weapon', {
      url: '/weapon',
      templateUrl: 'components/weapon-editor/weapons.html',
      controller: 'WeaponController'
    })
    .state('asset', {
      url: '/asset',
      templateUrl: 'components/asset-editor/assets.html',
      controller: 'AssetController'
    });
})

/* 
  File reader for image processing.
  Code credit: http://odetocode.com/blogs/scott/archive/2013/07/03/building-a-filereader-service-for-angularjs-the-service.aspx
*/
.factory('FileReader', [
  '$q', '$log',
  function($q, $log) {

    var onLoad = function(reader, deferred, scope) {
      return function() {
        scope.$apply(function() {
          deferred.resolve(reader.result);
        });
      };
    };

    var onError = function(reader, deferred, scope) {
      return function() {
        scope.$apply(function() {
          deferred.reject(reader.result);
        });
      };
    };

    var onProgress = function(reader, scope) {
      return function(event) {
        scope.$broadcast('fileProgress',
          {
            total: event.total,
            loaded: event.loaded
          });
      };
    };

    var getReader = function(deferred, scope) {
      var reader = new FileReader();
      reader.onload = onLoad(reader, deferred, scope);
      reader.onerror = onError(reader, deferred, scope);
      reader.onprogress = onProgress(reader, scope);
      return reader;
    };

    var readAsDataUrl = function(file, scope) {
      var deferred = $q.defer();

      var reader = getReader(deferred, scope);
      reader.readAsDataURL(file);

      return deferred.promise;
    };

    return {
      readAsDataUrl: readAsDataUrl
    };
  }
]);
