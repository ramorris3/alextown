app.service('EnemyService', function() {

  var self = this;

  self.deserializeEnemy = function(enemyData, game, testing) {
    var data = angular.copy(enemyData);
    var enemy;
    var key = randomKey();
    var deathKey = randomKey();

    /* CORE GAME FUNCTIONS */
    enemy.preload = function() {
      // load main sprite (contains all "alive" animations)
      game.load.spritesheet(key, data.mainSprite, data.mainSpriteWidth, data.mainSpriteHeight);

      // load death sprite (contains death animation)
      game.load.spritesheet(deathKey, data.deathSprite, data.deathSpriteWidth, deathSpriteHeight);
    };

    enemy.create = function(x, y, playerSprite) {
      // create sprite
      this.sprite = game.add.sprite(x, y, key);
      // init animations
      this.sprite.animations.add('move', data.moveFrames, data.moveFps, true);
      this.sprite.animations.add('attack', data.attackFrames, data.attackFps, false);
      this.sprite.animations.add('damage', data.damageFrames, data.damageFps);

      // init target
      this.target = playerSprite;

      // init physics
      game.physics.enable(this.sprite, Phaser.Physics.ARCADE);

      // stats
      this.sprite.health = data.health;
      this.sprite.damage = data.damage;
      this.sprite.moveSpeed = data.moveSpeed;

      // init state function
      this.sprite.currentState = enemy.moveState;
    };

    enemy.update = function() {
      this.sprite.currentState();
    };

    /* STATE IMPLEMENTATIONS */
    enemy.moveState = function() {
      // play animation
      this.sprite.animations.play('run');

      // DEFAULT MARCHING MOVEMENT
      if (data.moveOptions.key === 'DEFAULT') {
        this.sprite.body.velocity.x = -this.sprite.moveSpeed;

      // FOLLOWING MOVEMENT
      } else if (data.moveOptions.key === 'FOLLOW') {
        // get distance to playerSprite
        var distance = this.sprite.game.math.distance(this.sprite.x, this.sprite.y, this.target.x, this.target.y);
        // if more than 4px away, follow
        if (distance > 4) {
          // Calculate the angle to the target
          var rotation = this.sprite.game.math.angleBetween(this.sprite.x, this.sprite.y, this.target.x, this.target.y);
          // set velocity vector based on rotation and speed
          this.sprite.body.velocity.setTo(
              Math.cos(rotation) * this.sprite.moveSpeed,
              Math.sin(rotation) * this.sprite.moveSpeed
          );
        } else {
          this.sprite.body.velocity.x = -this.sprite.moveSpeed;
        }

      // ERROR
      } else {
        throw new Error('movePattern.key')
      }
    };

    enemy.attackState = function() {
      this.sprite.animations.play('attack');

      // MELEE OR 'CHARGING' ATTACK
      if (data.attackPattern.key === 'MELEE') {
        console.log('attacking with melee');

      // FIRING/RANGED ATTACK
      } else if (data.attackPattern.key === 'RANGED') {
        console.log('attacking with ranged');

      // ERROR
      } else {
        throw new Error('Attack-pattern key unrecognized.');
      }

    };

    return enemy;
  };


  function randomKey() {
    return Math.random().toString(36).substring(7);
  }

});