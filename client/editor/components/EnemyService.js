app.service('EnemyService', function() {

  var self = this;

  //////////////////////
  // ENEMY OBJECT DEF //
  //////////////////////

  /* CONSTRUCTOR/CREATE FUNCTION */
  self.Enemy = function(game, x, y, data, playerSprite, testing) {
    this.game = game;

    // create sprite
    Phaser.Sprite.call(this, this.game, x, y, data.mainSprite);
    // init animations
    this.animations.add('move', data.moveFrames, data.moveFps);
    this.animations.add('attack', data.attackFrames, data.attackFps);
    this.animations.add('damage', data.damageFrames, data.damageFps);

    // init target
    this.target = playerSprite;

    // init physics
    this.game.physics.enable(this, Phaser.Physics.ARCADE);
    this.anchor.setTo(0.5, 0.5);

    // stats
    this.health = data.health;
    this.damage = data.damage;
    this.moveSpeed = data.moveSpeed;

    // config
    this.movePattern = data.movePattern.key;
    this.testing = testing;
    if (!this.testing) {
      this.collideWorldBounds = true;
    }

    // add to game
    this.game.add.existing(this);
  };

  self.Enemy.prototype = Object.create(Phaser.Sprite.prototype);
  self.Enemy.prototype.constructor = self.Enemy;

  /* UPDATE FUNCTION */
  self.Enemy.prototype.update = function() {
    // play moving animation by default
    this.animations.play('move');

    // DEFAULT MARCHING MOVEMENT
    if (this.movePattern === 'DEFAULT') {
      this.body.velocity.setTo(-this.moveSpeed, 0);

    // FOLLOWING MOVEMENT
    } else if (this.movePattern === 'FOLLOW') {
      // get distance to playerSprite
      var distance = this.game.math.distance(this.x, this.y, this.target.x, this.target.y);

      // if less than 100px away or to the right, chase
      if (distance < 100 || this.x > this.target.x) {
        // Calculate the angle to the target
        var rotation = this.game.math.angleBetween(this.x, this.y, this.target.x, this.target.y);
        // set velocity vector based on rotation and speed
        this.body.velocity.setTo(
            Math.cos(rotation) * this.moveSpeed,
            Math.sin(rotation) * this.moveSpeed
        );
      } else { // leave the player alone and continue march
        this.body.velocity.setTo(-this.moveSpeed, 0);
      }

    // MOVE DATA ERROR
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
    if (this.testing && this.x < -this.width) { // off screen to the left
      this.x = this.game.width + this.width;
    }
  };

  console.log('done with service init');

});