app.service('EnemyService', function() {

  var self = this;

  self.createEnemyFromData = function(enemyData, game, testing) {
    var data = angular.copy(enemyData);

    var enemy = {};

    var key = randomKey(); // so we can load multiple enemies at once

    enemy.preload = function() {
      game.load.spritesheet(key, data.sprites.src, data.sprites.moveSprite.width, data.sprites.moveSprite.height);
    };

    enemy.create = function(x, y) {
      this.sprite = game.add.sprite(x, y, key);
      this.sprite.animations.add('run', data.sprites.moveSprite.frames, data.sprites.moveSprite.fps, true);

      game.physics.enable(this.sprite, Phaser.Physics.ARCADE);

      this.sprite.health = data.stats.health;
      this.sprite.moveSpeed = data.stats.moveSpeed;
      this.sprite.damage = data.stats.damage;
    };

    enemy.update = function(target) {
      data.move(this.sprite, target);

      // loop sprite position when they go off the screen, if in test mode
      if (testing) {
        if (this.sprite.x < -this.sprite.width) {
          this.sprite.x = game.width;
          this.sprite.y = Math.floor(Math.random() * (400 - 50 + 1)) + 50; // somewhere between y=50 and y=400
        }
      } else {
        this.sprite.kill();
      }
    };

    return enemy;
  };


  function randomKey() {
    return Math.random().toString(36).substring(7);
  }

});