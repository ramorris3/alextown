var WarriorPlayer = function(game, x, y) {

    Phaser.Sprite.call(this, game, x, y, 'warrior');

    this.animations.add('run', [0,1,2,3], 10, true);
    this.smoothed = false;

    // add player sword
    this.sword = game.add.sprite(0, 0, this);
    this.sword.animations.add('swing', [0,1,2,3,4,5,6], 25, false);
    this.sword.kill();
    this.addChild(this.sword);

    // movement constants
    this.MAX_SPEED = 280;
    this.DIAG_SPEED = this.MAX_SPEED / Math.sqrt(2);
    this.ACCELERATION = 1500;
    this.DRAG = 1450;

    // enable physics for player
    game.physics.enable(this, Phaser.Physics.ARCADE);

    // make player stay in screen
    this.body.collideWorldBounds = true;

    // add drag to the player
    this.body.drag.setTo(this.DRAG, this.DRAG); // x, y

    // set up keyboard input
    this.cursors = game.input.keyboard.createCursorKeys();
    this.keys = game.input.keyboard;
};

WarriorPlayer.prototype = Object.create(Phaser.Sprite.prototype);
WarriorPlayer.prototype.constructor = WarriorPlayer;

WarriorPlayer.prototype.update = function() {
    /** PLAYER LOGIC **/
    this.animations.play('run');

    if (this.keys.isDown(Phaser.Keyboard.D)) {
        console.log('got input');
    }

    // set up min and max mvt speed
    if ((this.cursors.left.isDown || this.cursors.right.isDown) &&
        (this.cursors.up.isDown || this.cursors.down.isDown)) {
        this.body.maxVelocity.setTo(this.DIAG_SPEED, this.DIAG_SPEED); // x, y
    } else {
        this.body.maxVelocity.setTo(this.MAX_SPEED, this.MAX_SPEED); // x, y
    }


    if (this.cursors.left.isDown) {
      this.body.acceleration.x = -this.ACCELERATION;
    } else if (this.cursors.right.isDown) {
        this.body.acceleration.x = this.ACCELERATION;
    } else {
        this.body.acceleration.x = 0;
    }

    if (this.cursors.up.isDown) {
      this.body.acceleration.y = -this.ACCELERATION;
    } else if (this.cursors.down.isDown) {
      this.body.acceleration.y = this.ACCELERATION;
    } else {
      this.body.acceleration.y = 0;
    }
};