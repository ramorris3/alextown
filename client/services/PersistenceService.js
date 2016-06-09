app.service('PersistenceService', 
  ['LevelService',
  function(LevelService) {
    var self = this;

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