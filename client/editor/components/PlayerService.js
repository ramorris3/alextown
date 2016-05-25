app.service('PlayerService', function() {

  var self = this;


  ///////////////////////
  // PLAYER OBJECT DEF //
  ///////////////////////

  self.Player = function(game, x, y, data, testing) {
    this.game = game;

    // create sprite
    Phaser.Sprite.call(this, this.game, x, y, data.mainSprite.key);
    // init animations
    this.animations.add('move', data.moveFrames, data.moveFps);
    this.animations.add('attack', data.attackFrames, data.attackFps);
    console.log(this.animations);
    console.log(this.animations.attack);
    this.animations.add('damage', data.damageFrames, data.damageFps);

    // physics
    this.game.physics.enable(this, Phaser.Physics.ARCADE);
    this.body.collideWorldBounds = true;
    this.anchor.setTo(0.5, 0.5);
    this.body.drag.setTo(1450, 1450); // x, y

    // configuration
    this.testing = testing;
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
      this.game.allPlayerBullets.add(this.bullets);
      // bullet speed
      this.bulletSpeed = this.attackPattern.bulletSpeed;
    }
    // melee?

    // controls
    this.cursors = this.game.input.keyboard.createCursorKeys();
    this.game.input.keyboard.addKeyCapture([Phaser.Keyboard.SPACEBAR]);
  
    // add to game
    this.game.add.existing(this);
  };

  self.Player.prototype = Object.create(Phaser.Sprite.prototype);
  self.Player.prototype.constructor = self.Player;

  self.Player.prototype.update = function() {
    this.animations.play('move');

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

    // tick the attack cooldown clock
    if (this.cooldownClock > 0) {
      this.cooldownClock--;
    }

    // if attacking
    if (this.game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR)) { // input received
      this.animations.play('attack');
      console.log('played attack animation');
      console.log(this.animations.currentAnim);
      console.log(this.animations.currentFrame);
      if (this.attackPattern.key === 'Ranged') { 
        if (!this.cooldownClock) {// cooldown inactive
          this.cooldownClock = this.cooldown;
          var bullet = this.bullets.getFirstDead();
          if (bullet) {
            bullet.revive();
            bullet.checkWorldBounds = true;
            bullet.outOfBoundsKill = true;
            bullet.reset(this.x, this.y);
            bullet.body.velocity.x = this.bulletSpeed;
          }
        }
      } else {
        throw new Error('Attack-pattern key not recognized in PlayerService.js');
      }
    }
  };

});