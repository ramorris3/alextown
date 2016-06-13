app.service('PlayerService', 
  ['$http', 'DamageService', 'LoaderService', 
  function($http, DamageService, LoaderService) {

    var self = this;

    var allPlayers = {};
    self.getAllPlayers = function() {
      return allPlayers;
    };
    self.getPlayer = function(key) {
      return allPlayers[key];
    };

    init();

    ///////////////////////
    // PLAYER OBJECT DEF //
    ///////////////////////

    self.Player = function(game, x, y, data) {
      this.game = game;

      // create sprite
      console.log(data.moveFrames);
      Phaser.Sprite.call(this, this.game, x, y, data.spritesheet.key);
      // init animations
      this.animations.add('move', data.moveFrames, data.moveFps);
      this.animations.add('attack', data.attackFrames, data.attackFps);
      this.animations.add('damage', data.damageFrames, data.damageFps);
      // shadow
      var shadow = this.game.add.sprite(0, 32, 'shadow');
      shadow.anchor.setTo(0.5, 0.5);
      this.game.layers.shadows.add(shadow);
      var player = this;
      shadow.update = function() {
        this.x = player.x;
        this.y = player.y + (player.height / 2);
        if (player.health <= 0) {
          this.pendingDestroy = true;
        }
      };

      //var shadow = this.addChild(this.game.add.sprite(0, this.height / 2), 'shadow');

      // physics
      this.game.physics.enable(this, Phaser.Physics.ARCADE);
      this.body.collideWorldBounds = true;
      this.anchor.setTo(0.5, 0.5);
      this.body.drag.setTo(1450, 1450); // x, y

      // damage logic flags
      this.invincible = false;
      this.flashing = false;
      this.flashTimer = 0;

      // configuration
      this.health = data.health;
      this.damage = data.damage;
      this.maxSpeed = data.moveSpeed;
      this.diagSpeed = this.maxSpeed / Math.sqrt(2);
      this.acceleration = 1500;
      this.attackPattern = data.attackPattern;
      this.cooldown = this.attackPattern.cooldown;
      this.cooldownClock = 0;
      if (this.attackPattern.key === 'Ranged') {
        // create bullet pool
        this.bullets = this.game.add.group();
        this.bullets.createMultiple(30, this.attackPattern.bullet.key);
        this.bullets.setAll('anchor.x', 0.5);
        this.bullets.setAll('anchor.y', 0.5);
        this.bullets.setAll('outOfBoundsKill', true);
        this.game.physics.enable(this.bullets, Phaser.Physics.ARCADE);
        // for (var bullet in this.bullets) {
        //   bullet.animations.add('fly');
        // }
        this.game.allPlayerBullets.add(this.bullets);
        // bullet speed
        this.bulletSpeed = this.attackPattern.bulletSpeed;
      }
      // melee?

      // state config
      this.currentState = this.defaultState;

      // controls
      this.cursors = this.game.input.keyboard.createCursorKeys();
      this.game.input.keyboard.addKeyCapture([Phaser.Keyboard.SPACEBAR]);
    
      // add to game
      this.game.add.existing(this);
    };

    self.Player.prototype = Object.create(Phaser.Sprite.prototype);
    self.Player.prototype.constructor = self.Player;

    self.Player.prototype.update = function() {

      DamageService.flash(this);

      // tick the attack cooldown clock
      if (this.cooldownClock > 0) {
        this.cooldownClock--;
      }

      // state function (includes animation)
      this.currentState();
    };


    ///////////////////////////////////////
    // PLAYER HELPER AND STATE FUNCTIONS //
    ///////////////////////////////////////

    // this function handles movement without playing the animation
    // (can be used in multiple states)
    self.Player.prototype.move = function() {
      // move player without choosing animation
      // set up min and max mvt speed
      if ((this.cursors.left.isDown || this.cursors.right.isDown) &&
         (this.cursors.up.isDown || this.cursors.down.isDown)) {
         this.body.maxVelocity.setTo(this.diagSpeed, this.diagSpeed); // x, y
      } else {
         this.body.maxVelocity.setTo(this.maxSpeed, this.maxSpeed); // x, y
      }

      // movement and controls
      if (this.cursors.left.isDown) {
       this.body.acceleration.x = -this.acceleration;
      } else if (this.cursors.right.isDown) {
         this.body.acceleration.x = this.acceleration;
      } else {
         this.body.acceleration.x = 0;
      }

      if (this.cursors.up.isDown) {
       this.body.acceleration.y = -this.acceleration;
      } else if (this.cursors.down.isDown) {
       this.body.acceleration.y = this.acceleration;
      } else {
       this.body.acceleration.y = 0;
      }
    };

    self.Player.prototype.isAttacking = function() {
      return this.game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR);
    };

    /////////////////////
    // STATE FUNCTIONS //
    /////////////////////

    self.Player.prototype.defaultState = function() {
      // move the player and play move animation
      this.move();
      this.animations.play('move');

      // switch states
      // if attacking
      if (this.isAttacking()) {
        this.currentState = this.attackState;
      }
    };

    self.Player.prototype.attackState = function() {
      // can move while firing
      this.move();

      // RANGED ATTACK
      if (this.attackPattern.key === 'Ranged') { 
        if (!this.cooldownClock) { // cooldown inactive
          // fire bullet
          this.cooldownClock = this.cooldown;
          var bullet = this.bullets.getFirstDead();
          if (bullet) {
            bullet.revive();
            bullet.checkWorldBounds = true;
            bullet.outOfBoundsKill = true;
            bullet.reset(this.x, this.y);
            bullet.body.velocity.x = this.bulletSpeed;
            //bullet.animations.play('fly', 10, true);
          }
        }
      // MELEE ???
      // AOE ???

      // UNSPECIFIED
      } else {
        throw new Error('Attack-pattern key not recognized in PlayerService.js');
      }

      this.animations.play('attack');

      // STATE ROUTING
      // go back to default if animation is finished
      var sprite = this;
      this.animations.currentAnim.onComplete.add(function() {
        if (sprite.isAttacking()) {
          sprite.currentState = sprite.attackState;
        } else {
          sprite.currentState = sprite.defaultState;
        }
      }, sprite.game);
    };

    ///////////////////
    // INIT FUNCTION //
    ///////////////////

    function init() {
      $http.get('/api/players')
        .success(function(data) {
          allPlayers = data.allPlayerData;
          LoaderService.player = true;
          LoaderService.loadHandler();
        })
        .error(function(data) {
          MessageService.setFlashMessage(data.message, true);
        });
    }

  }
]);