var WarriorPlayer = function(game, x, y) {
    this.game = game;

    Phaser.Sprite.call(this, this.game, x, y, 'warrior');

    this.animations.add('run', [0,1,2,3], 10, true);
    this.smoothed = false;

    // add player sword
    this.sword = this.game.add.existing(
            new WarriorSword(this.game)
        );
    this.addChild(this.sword);

    // movement constants
    this.MAX_SPEED = 280;
    this.DIAG_SPEED = this.MAX_SPEED / Math.sqrt(2);
    this.ACCELERATION = 1500;
    this.DRAG = 1450;

    // enable physics for player
    this.game.physics.enable(this, Phaser.Physics.ARCADE);

    // make player stay in screen
    this.body.collideWorldBounds = true;

    // add drag to the player
    this.body.drag.setTo(this.DRAG, this.DRAG); // x, y

    // set up keyboard input
    this.cursors = this.game.input.keyboard.createCursorKeys();
    this.game.input.keyboard.addKeyCapture([Phaser.Keyboard.SPACEBAR]);
};

WarriorPlayer.prototype = Object.create(Phaser.Sprite.prototype);
WarriorPlayer.prototype.constructor = WarriorPlayer;

WarriorPlayer.prototype.update = function() {
    /** PLAYER LOGIC **/
    this.animations.play('run');

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

    if (this.game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR)) {
        this.sword.swing();
    }
};

// player sword class definition
var WarriorSword = function(game) {
    this.game = game;
    Phaser.Sprite.call(this, game, 20, -20, 'warriorsword');
    game.physics.enable(this, Phaser.Physics.ARCADE);
    this.animations.add('swing', [0,1,2,3,4,5,6,7,8,9], 30, false);
    this.smoothed = false;

    // basic attack logic
    this.nextSwing = 0;
    this.swingRate = 150; // sword swing cool down
    this.kill();
};

WarriorSword.prototype = Object.create(Phaser.Sprite.prototype);
WarriorSword.prototype.constructor = WarriorSword;

WarriorSword.prototype.swing = function() {
    // return if cool down between sword swings still active
    if (this.game.time.time < this.nextSwing) {
        return;
    }

    // play sword animation
    this.revive();
    this.animations.play('swing', 30, false, true); // kill on animation complete

    // set cooldown
    this.nextSwing = this.game.time.time + this.swingRate;
};