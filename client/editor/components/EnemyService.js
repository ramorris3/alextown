app.service('EnemyService', function() {

  var self = this;


  //////////////////////
  // ENEMY OBJECT DEF //
  //////////////////////

  self.deserializeEnemyData = function(enemyData, game, testing) {
    var data = angular.copy(enemyData);
    var key = randomKey();
    var deathKey = randomKey();

    var Enemy = function(data, game, testing) {
    };

    Enemy.prototype.constructor = Enemy;

    /* CORE GAME FUNCTIONS */
    Enemy.prototype.preload = function() {
      // load main sprite (contains all "alive" animations)
      game.load.spritesheet(key, data.mainSprite, data.mainSpriteWidth, data.mainSpriteHeight);

      // load death sprite (contains death animation)
      game.load.spritesheet(deathKey, data.deathSprite, data.deathSpriteWidth, data.deathSpriteHeight);
    };

    Enemy.prototype.create = function(x, y, playerSprite) {
      // create sprite
      this.sprite = game.add.sprite(x, y, key);
      // init animations
      this.sprite.animations.add('move', data.moveFrames, data.moveFps);
      this.sprite.animations.add('attack', data.attackFrames, data.attackFps);
      this.sprite.animations.add('damage', data.damageFrames, data.damageFps);

      console.log(this.sprite.animations);

      // init target
      this.target = playerSprite;

      // init physics
      game.physics.enable(this.sprite, Phaser.Physics.ARCADE);
      this.sprite.anchor.setTo(0.5, 0.5);
      if (!testing) {
        this.sprite.collideWorldBounds = true;
      }

      // stats
      this.sprite.health = data.health;
      this.sprite.damage = data.damage;
      this.sprite.moveSpeed = data.moveSpeed;

      // init state function
      this.currentState = this.moveState;
    };

    /* STATE IMPLEMENTATIONS */
    Enemy.prototype.update = function() {
      // play animation
      this.sprite.animations.play('move');

      // DEFAULT MARCHING MOVEMENT
      if (data.movePattern.key === 'DEFAULT') {
        this.sprite.body.velocity.setTo(-this.sprite.moveSpeed, 0);

      // FOLLOWING MOVEMENT
      } else if (data.movePattern.key === 'FOLLOW') {
        // get distance to playerSprite
        var distance = this.sprite.game.math.distance(this.sprite.x, this.sprite.y, this.target.x, this.target.y);

        // if less than 100px away or to the right, chase
        if (distance < 100 || this.sprite.x > this.target.x) {
          // Calculate the angle to the target
          var rotation = this.sprite.game.math.angleBetween(this.sprite.x, this.sprite.y, this.target.x, this.target.y);
          // set velocity vector based on rotation and speed
          this.sprite.body.velocity.setTo(
              Math.cos(rotation) * this.sprite.moveSpeed,
              Math.sin(rotation) * this.sprite.moveSpeed
          );
        } else { // leave the player alone and continue march
          this.sprite.body.velocity.setTo(-this.sprite.moveSpeed, 0);
        }

      // ERROR
      } else {
        throw new Error('Move-pattern key unrecognized.');
      }

      // ATTACKING
      // if attackPattern.key === 'MELEE', check range.  
        // If in range, check if cooldown is inactive and check duration clock
          // if cooldown is inactive, change animation to 'attack', increase move speed, and generate dust balls by feet. 

      // if attackPattern.key === 'RANGED', check cooldown
        // if cooldown is inactive, change animation to 'attack', generate dust balls, and create a bullet

      // TESTING
      if (testing && this.sprite.x < -this.sprite.width) { // off screen to the left
        this.sprite.x = game.width + this.sprite.width;
      }
    };

    return new Enemy(data, game, testing);
  };


  ////////////////////
  // HELPER METHODS //
  ////////////////////

  function randomKey() {
    return Math.random().toString(36).substring(7);
  }

});