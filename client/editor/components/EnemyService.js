/* 
  This service contains the enemy object definition,
  and handles loading and saving enemies from/to the database
*/
app.service('EnemyService', function() {

  var self = this;


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

    // enemy behavior config
    this.testing = testing;
    this.movePattern = data.movePattern;
    this.attackPattern = data.attackPattern;
    if (this.attackPattern.key === 'Charge') {
      this.getAttackStateInfo = this.getChargeStateInfo;
    } else if (this.attackPattern.key === 'Ranged') {
      this.getAttackStateInfo = this.getRangedStateInfo;
    } else {
      throw new Error('Attack-pattern key not recognized.');
    }
    this.getAttackStateInfo().setup();

    // state config
    this.currentState = this.defaultState;

    // add to game
    this.game.add.existing(this);
  };

  self.Enemy.prototype = Object.create(Phaser.Sprite.prototype);
  self.Enemy.prototype.constructor = self.Enemy;

  /* UPDATE FUNCTION */
  self.Enemy.prototype.update = function() {

    // execute active state
    this.currentState();

    // kill only if off screen to the left
    if (this.x < -this.width) {
      // if testing, reset enemy
      if(this.testing) {
        this.x = this.game.width + this.width;
        this.y = Math.floor(Math.random() * 350) + 50;
        this.cooldownClock = 0;
      } else {
        this.pendingDestroy = true;
      }
    }
  };


  ///////////////////////////////////
  // ATTACK OPTION IMPLEMENTATIONS //
  ///////////////////////////////////

  /*
    Any time you want to add another attack option to the enemy editor, you should implement it here with a getAttackStateInfo object.

    Also, include any configurable variables that you will use for this stateInfo object in the EnemyController.enemyAttackOptions list

    Each "info" function returns an object which represents an implementation of an enemy attack option.  There are three functions in each info object:
      1) setVars: sets up all the variables needed for the attack state.  Should be called within sprite.create.
      2) startAttack: checks preconditions before each attack, and does any one-time initialization before entering the attack state.  Should be called within each default state loop to check if attack should initiate
      3) attackState: the implementation of the actual attack state itself.  Upon finishing, it will reset Enemy.currentState to Enemy.defaultState

    Info functions are stored in an Enemy-scoped variable, so that they can be swapped out depending on which enemyAttackOption was chosen.

    For example: 
      // in the enemy.create method:
      if (this.attackPattern.key === 'Charge') {
        this.getAttackStateInfo = this.getChargeStateInfo;
      }
      this.getAttackStateInfo().setup();
      ...
      // in enemy.defaultState method:
      if (this.getAttackStateInfo().startAttack()) {
        this.currentState = this.getAttackStateInfo().attackState;
      }
  */

  self.Enemy.prototype.getChargeStateInfo = function() {
    var sprite = this;
    return {
      // call in the create function
      setup: function() {
        sprite.cooldown = sprite.attackPattern.cooldown;
        sprite.cooldownClock = 0;
        sprite.chargeSpeed = sprite.attackPattern.chargeSpeed;
        sprite.chargeDuration = sprite.attackPattern.duration;
        sprite.chargeClock = 0;
        sprite.chargeRange = sprite.attackPattern.range;
      },
      // call before switching states to 'attack'
      startAttack: function() {
        if (sprite.cooldownClock) {
          sprite.cooldownClock--;
        }

        // get distance to player to check if in range
        var dist = sprite.game.math.distance(sprite.x, sprite.y, sprite.target.x, sprite.target.y);

        // if in range, and if cooldown inactive, start charge
        if (dist < sprite.chargeRange && !sprite.cooldownClock) {
          // reset cooldown, set chargeDuration clock, set direction
          sprite.cooldownClock = sprite.cooldown;
          sprite.chargeClock = sprite.chargeDuration;
          sprite.chargeRotation = sprite.game.math.angleBetween(sprite.x, sprite.y, sprite.target.x, sprite.target.y);
          return true;
        }

        return false; // attack not ready to start
      },
      // state implementation
      attackState: function() {
        // charging
        if (sprite.chargeClock) {
          sprite.chargeClock--; // duration of charge - ticks down towards 0

          sprite.animations.play('attack');

          sprite.body.velocity.setTo(
            Math.cos(sprite.chargeRotation) * sprite.chargeSpeed,
            Math.sin(sprite.chargeRotation) * sprite.chargeSpeed
          );

          // stop charging if going out of bounds
          if (sprite.right > sprite.game.width) {
            sprite.body.velocity.setTo(0, 0);
            sprite.x = sprite.game.width - sprite.offsetX;
            sprite.chargeClock = 0;
          }
          if (sprite.bottom > sprite.game.height) {
            sprite.body.velocity.setTo(0, 0);
            sprite.y = sprite.game.height - sprite.offsetY;
            sprite.chargeClock = 0;
          } else if (sprite.top < 0) {
            sprite.body.velocity.setTo(0, 0);
            sprite.y = sprite.offsetY;
            sprite.chargeClock = 0;
          }
        // done charging, back to default state
        } else {
          sprite.currentState = sprite.defaultState;
        }
      }
    };
  };

  self.Enemy.prototype.getRangedStateInfo = function() {
    var sprite = this;
    return {
      setup: function() {
        sprite.cooldown = sprite.attackPattern.cooldown;
        sprite.cooldownClock = 0;
        // create bullet pool
        sprite.bullets = sprite.game.add.group();
        sprite.bullets.createMultiple(30, sprite.attackPattern.bullet.key);
        sprite.bullets.setAll('anchor.x', 0.5);
        sprite.bullets.setAll('anchor.y', 0.5);
        sprite.bullets.setAll('outOfBoundsKill', true);
        sprite.game.physics.enable(sprite.bullets, Phaser.Physics.ARCADE);
        sprite.game.allEnemyBullets.add(sprite.bullets);
        sprite.bulletSpeed = sprite.attackPattern.bulletSpeed;

        sprite.fireBullet = function() {
          sprite.cooldownClock = sprite.cooldown;
          var bullet = sprite.bullets.getFirstDead();
          if (bullet) {
            bullet.revive();
            bullet.checkWorldBounds = true;
            bullet.outOfBoundsKill = true;
            bullet.reset(sprite.x, sprite.y);
            bullet.body.velocity.x = -sprite.bulletSpeed;
          }
        };

      },
      startAttack: function() {
        // cooldown still active
        if (sprite.cooldownClock) {
          sprite.cooldownClock--;
          return false;
        }

        sprite.fireBullet();
        return true;
      },
      attackState: function() {
        // moves while firing
        sprite.move();

        // play attack animation, go back to normal movement/animation when finished
        sprite.animations.play('attack');

        // go back to normal animation when finished
        sprite.animations.currentAnim.onComplete.add(function() {
          if (sprite.cooldownClock) { // cooldown active, back to default state
            sprite.currentState = sprite.defaultState;
          } else { // cooldown inactive, continue to play attack animation and shoot another bullet
            sprite.fireBullet();
          }
        });
      }
    };
  };

  ///////////////////////////
  // OTHER STATE FUNCTIONS //
  ///////////////////////////

  self.Enemy.prototype.defaultState = function() {
    // regular movement
    this.move();
    this.animations.play('move');

    // switch states if attacking
    if (this.getAttackStateInfo().startAttack()) {
      this.currentState = this.getAttackStateInfo().attackState;
    }
  };

  // this function handles movement without playing the animation
  // (can be used in multiple states)
  self.Enemy.prototype.move = function() {

    // DEFAULT MARCHING MOVEMENT
    if (this.movePattern === 'Default') {
      this.body.velocity.setTo(-this.moveSpeed, 0);

    // FOLLOWING MOVEMENT
    } else if (this.movePattern === 'Follow') {
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
      throw new Error('Move-pattern key unrecognized');
    }
  };


});