app.controller('WeaponController',
  ['$scope', 'AssetService', 'MessageService', 'PlayerService', 'WeaponService',
  function($scope, AssetService, MessageService, PlayerService, WeaponService) {
    $scope.weaponData = {};
    $scope.getSprites = AssetService.getBullets;
    $scope.getPatterns = WeaponService.getFirePatterns;
    $scope.getRarities = WeaponService.getRarities;
    $scope.getAllPlayers = PlayerService.getAllPlayers;

    $scope.saveWeapon = function() {
      message = 'All fields are required.';
      if (!$scope.weaponData.name || !$scope.weaponData.description || !$scope.weaponData.rarity || !$scope.weaponData.firePattern || !$scope.weaponData.spritesheet) {
        MesssageService.setFlashMessage(message, true);
        return;
      }
      WeaponService.saveWeapon($scope.weaponData);
    };
  }
]);