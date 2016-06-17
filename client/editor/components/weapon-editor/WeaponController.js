app.controller('WeaponController',
  ['$scope', 'AssetService', 'MessageService', 'PlayerService', 'WeaponService',
  function($scope, AssetService, MessageService, PlayerService, WeaponService) {
    $scope.weaponData = {};
    $scope.getSprites = AssetService.getBullets;
    $scope.getPatterns = WeaponService.getFirePatterns;
    $scope.getRarities = WeaponService.getRarities;
    $scope.getAllPlayers = PlayerService.getAllPlayers;
    $scope.playerLevels = [];
    for (var i = 1; i <= 30; i++) {
      $scope.playerLevels.push(i);
    }

    $scope.saveWeapon = function() {
      if (!$scope.weaponData.name ||
        !$scope.weaponData.description ||
        !$scope.weaponData.rarity ||
        !$scope.weaponData.class ||
        !$scope.weaponData.level ||
        typeof $scope.weaponData.damageBoost === undefined ||
        !$scope.weaponData.firePattern ||
        !$scope.weaponData.spritesheet) {
        MessageService.setFlashMessage('All fields are required.', true);
        return;
      }
      console.log(typeof $scope.weaponData.damageBoost);
      WeaponService.saveWeapon($scope.weaponData);
    };
  }
]);