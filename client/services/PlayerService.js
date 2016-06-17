app.service('PlayerService', 
  ['$http', 'DamageService', 'LoaderService', 'WeaponService',
  function($http, DamageService, LoaderService, WeaponService) {

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

    self.Player = function(game, x, y, data, weaponData) {
      this.game = game;

      // create sprite
      Phaser.Sprite.call(this, this.game, x, y, data.spritesheet.key);
      // init animations
      this.animations.add('move', data.moveFrames, data.moveFps);

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

      // physics
      this.game.physics.enable(this, Phaser.Physics.ARCADE);
      this.body.collideWorldBounds = true;
      this.anchor.setTo(0.5, 0.5);
      this.body.drag.setTo(1450, 1450); // x, y

      // damage logic flags
      this.invincible = false;
      this.flashing = false;
      this.flashTimer = 0;

      // stats and movement configuration
      this.health = data.health;
      this.damage = data.damage;
      this.maxSpeed = data.moveSpeed;
      this.diagSpeed = this.maxSpeed / Math.sqrt(2);
      this.acceleration = 1500;

      // weapon
      this.weaponData = weaponData;
      this.weapon = WeaponService.getFirePattern(this.weaponData.firePattern);
      this.weapon.create(this.game, this.weaponData);

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

      this.move();
      this.animations.play('move');

      if (this.isAttacking()) {
        this.weapon.fire(this.game, this);
      }
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

    // handle attack input
    self.Player.prototype.isAttacking = function() {
      return this.game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR);
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