app.service('PlayerService', function() {

  var self = this;

  self.createPlayerFromData = function(playerData, game, testing) {
    var data = angular.copy(playerData);

    var player = {
      sprite: null
    };
    var cursors;
    // movement constants
    var maxSpeed = playerData.stats.moveSpeed;
    var diagSpeed = maxSpeed / Math.sqrt(2);
    var acceleration = 1500;
    var drag = 1450;

    player.preload = function() {
      // load player moveSprite
      game.load.spritesheet('player', data.sprites.src, data.sprites.moveSprite.width, data.sprites.moveSprite.height);
    };

    player.create = function(x, y) {
      this.sprite = game.add.sprite(x, y, 'player');
      this.sprite.animations.add('run', data.sprites.moveSprite.frames, data.sprites.moveSprite.fps, true);

      game.physics.enable(this.sprite, Phaser.Physics.ARCADE);
      this.sprite.body.collideWorldBounds = true;
      this.sprite.body.drag.setTo(drag, drag); // x, y
      this.sprite.anchor.setTo(0.5,0.5);

      this.sprite.health = data.stats.health;
      this.sprite.moveSpeed = data.stats.moveSpeed;
      this.sprite.damage = data.stats.damage;

      cursors = game.input.keyboard.createCursorKeys();
    };

    player.update = function() {
      this.sprite.animations.play('run');

      // set up min and max mvt speed
      if ((cursors.left.isDown || cursors.right.isDown) &&
         (cursors.up.isDown || cursors.down.isDown)) {
         this.sprite.body.maxVelocity.setTo(diagSpeed, diagSpeed); // x, y
      } else {
         this.sprite.body.maxVelocity.setTo(maxSpeed, maxSpeed); // x, y
      }

      // movement and controls
      if (cursors.left.isDown) {
       this.sprite.body.acceleration.x = -acceleration;
      } else if (cursors.right.isDown) {
         this.sprite.body.acceleration.x = acceleration;
      } else {
         this.sprite.body.acceleration.x = 0;
      }

      if (cursors.up.isDown) {
       this.sprite.body.acceleration.y = -acceleration;
      } else if (cursors.down.isDown) {
       this.sprite.body.acceleration.y = acceleration;
      } else {
       this.sprite.body.acceleration.y = 0;
      }
    };

    return player;
  };

});