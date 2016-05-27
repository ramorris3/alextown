/* 
  This service contains the enemy object definition,
  and handles loading and saving enemies from/to the database
*/
app.service('EnemyService', function() {

  var self = this;

  // movement enum
  var moveOptions = {
    Default: 0,
    Follow: 1
  };
  self.getMoveOptions = function() {
    return moveOptions;
  };


  //////////////////////
  // ENEMY OBJECT DEF //
  //////////////////////

  /* CONSTRUCTOR/CREATE FUNCTION */
  self.Enemy = function(game, x, y, data, playerSprite, testing) {
    this.game = game;
    this.data = data;

    // create sprite
    Phaser.Sprite.call(this, this.game, x, y, data.mainSprite.key);
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
    this.originalMoveSpeed = this.moveSpeed;

    // config
    this.movePattern = data.movePattern;
    this.attackPattern = data.attackPattern;
    this.cooldown = this.attackPattern.cooldown;
    this.cooldownClock = 0;
    if (this.attackPattern.key === 'Ranged') {
      // create bullet pool
      this.bullets = this.game.add.group();
      this.bullets.createMultiple(30, data.attackPattern.bullet.key);
      this.bullets.setAll('anchor.x', 0.5);
      this.bullets.setAll('anchor.y', 0.5);
      this.bullets.setAll('outOfBoundsKill', true);
      this.game.physics.enable(this.bullets, Phaser.Physics.ARCADE);
      this.game.allEnemyBullets.add(this.bullets);
      // bullet speed
      this.bulletSpeed = data.attackPattern.bulletSpeed;
    } else if (this.attackPattern.key === 'Charge') {
      // set up melee vars
      this.chargeSpeed = this.attackPattern.chargeSpeed;
      this.chargeDuration = this.attackPattern.duration;
      this.chargeClock = 0;
      this.chargeRange = this.attackPattern.range;
    }
    
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

    // KILL ONLY IF OFF SCREEN TO THE LEFT
    if (this.x < -this.width) { // off screen to the left
      // if testing, reset enemy
      if(this.testing) {
        this.x = this.game.width + this.width;
        this.y = Math.floor(Math.random() * 350) + 50;
        this.cooldownClock = 0;
      } else {
        this.pendingDestroy = true;
      }
    }

    // play moving animation by default
    this.animations.play('move');

    // DEFAULT MARCHING MOVEMENT
    if (this.movePattern === moveOptions.Default) {
      this.body.velocity.setTo(-this.moveSpeed, 0);

    // FOLLOWING MOVEMENT
    } else if (this.movePattern === moveOptions.Follow) {
      // get distance to playerSprite
      var distance = this.game.math.distance(this.x, this.y, this.target.x, this.target.y);

      // if enemy to the right or within 150px, chase
      if (distance < 150 || this.x > this.target.x) {
        // Calculate the angle to the target
        var rotation = this.game.math.angleBetween(this.x, this.y, this.target.x, this.target.y);

        // move towards player without 'shaking'
        if (distance < this.moveSpeed) {
          this.body.velocity.setTo(
            Math.cos(rotation) * distance,
            Math.sin(rotation) * distance
          );
        } else {
          // set velocity vector based on rotation and speed
          this.body.velocity.setTo(
              Math.cos(rotation) * this.moveSpeed,
              Math.sin(rotation) * this.moveSpeed
          );
        }
      } else { // leave the player alone and continue march
        this.body.velocity.setTo(-this.moveSpeed, 0);
      }

    // MOVE DATA ERROR
    } else {
      throw new Error('Move-pattern key unrecognized in EnemyService.js');
    }

    // ATTACKING
    // tick cooldownClock
    this.cooldownClock = this.cooldownClock < 0 ? 0 : this.cooldownClock - 1;

    // if attackPattern.key === 'Charge', check range.  
      // If in range, check if cooldown is inactive and check duration clock
        // if cooldown is inactive, change animation to 'attack', increase move speed, and generate dust balls by feet. 
    // CHARGE
    if (this.attackPattern.key === 'Charge') {
      // get distance to check range
      var dist = this.game.math.distance(this.x, this.y, this.target.x, this.target.y);

      if (dist < this.chargeRange && // in range
        !this.cooldownClock) { // cooldown inactive
        // start charge
        // make a start charge state witha t ransition animation?
        this.cooldownClock = this.cooldown;
        this.chargeClock = this.chargeDuration;
        this.chargeRotation = this.game.math.angleBetween(this.x, this.y, this.target.x, this.target.y);
      }

      // charging
      if (this.chargeClock) {
        this.animations.play('attack');
        this.chargeClock--; // ticks down towards 0
        this.body.velocity.setTo(
          Math.cos(this.chargeRotation) * this.chargeSpeed,
          Math.sin(this.chargeRotation) * this.chargeSpeed
        );

        // stop charging if going out of bounds
        if (this.right > this.game.width) {
          this.body.velocity.setTo(0, 0);
          this.x = this.game.width - this.offsetX;
          this.chargeClock = 0;
        }
        if (this.bottom > this.game.height) {
          this.body.velocity.setTo(0, 0);
          this.y = this.game.height - this.offsetY;
          this.chargeClock = 0;
        } else if (this.top < 0) {
          this.body.velocity.setTo(0, 0);
          this.y = this.offsetY;
          this.chargeClock = 0;
        }
      }

    // RANGED
    } else if (this.attackPattern.key === 'Ranged') {
      if (!this.cooldownClock) {
        this.animations.play('attack');
        this.cooldownClock = this.cooldown;
        var bullet = this.bullets.getFirstDead();
        if (bullet) {
          bullet.revive();
          bullet.checkWorldBounds = true;
          bullet.outOfBoundsKill = true;
          bullet.reset(this.x, this.y);
          bullet.body.velocity.x = -this.bulletSpeed;
        }
      }
    
    // ATTACK PATTERN ERROR
    } else {
      throw new Error('Attack-pattern key unrecognized in EnemyService.js');
    }
  };

});