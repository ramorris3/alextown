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
    // this.animations.add(attack)
    // this.animations.add(damage)

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

    // controls
    this.cursors = this.game.input.keyboard.createCursorKeys();
  
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
  };

});