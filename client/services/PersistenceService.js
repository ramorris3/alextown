app.service('PersistenceService', 
  ['LevelService', 'PlayerService', 'WeaponService',
  function(LevelService, PlayerService, WeaponService) {
    var self = this;

    var playerData = {};
    self.getPlayerData = function() {
      return PlayerService.getPlayer('Mage');
    };

    // hardcoded default weapon. changes when you equip something else
    var currentWeapon = {
      "name": "Starting Dagger",
      "description": "This old, chipped dagger doesn't look too intimidating.",
      "rarity": "Common",
      "class": "Mage",
      "level": 1,
      "damageBoost": 0,
      "firePattern": "SingleBullet",
      "spritesheet": {
        "type": "Bullets",
        "name": "dagger-right",
        "width": 64,
        "height": 22,
        "key": "dagger-right",
        "src": "../game/assets/rusty-dagger.png"
      }
    };
    self.getCurrentWeapon = function() {
      return currentWeapon;
    };
    self.setCurrentWeapon = function(newWeapon) {
      currentWeapon = newWeapon;
    };

    var currentLevel = 1;
    self.getCurrentLevel = function(game) {
      var levelData = LevelService.getLevel(currentLevel);
      while (!levelData) {
        if (currentLevel > 10) {
          game.state.start('win');
          currentLevel = 1;
          return false;
        }
        currentLevel++;
        levelData = LevelService.getLevel(currentLevel);
      }
      return levelData;
    };

    self.nextLevel = function(game) {
      currentLevel++;
      if (self.getCurrentLevel(game)) {
        game.state.start('prelevel');
      }
    };
  }
]);