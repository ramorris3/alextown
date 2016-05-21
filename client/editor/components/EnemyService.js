app.service('EnemyService', function() {

  var self = this;

  self.createEnemyFromData = function(enemyData, game) {
    var data = angular.copy(enemyData);

    var enemy = {
      game: game
    };

    var key = randomKey();

    enemy.preload = function() {
      game.load.image(key, data.sprites.moveSprite.src);
    };

    enemy.create = function(x, y) {
      sprite = game.add.sprite(x, y, key);
      game.physics.enable(sprite, Phaser.Physics.ARCADE);
      sprite.health = data.stats.health;
      sprite.moveSpeed = data.stats.moveSpeed;
    };

    enemy.update = function(target) {
      data.move(sprite, target);
    };

    return enemy;
  };


  function randomKey() {
    return Math.random().toString(36).substring(7);
  }

});