var WarriorPlayer = function(game, x, y) {
    this.game = game;

    Phaser.Sprite.call(this, this.game, x, y, 'warrior');

    this.animations.add('run', [0,1,2,3], 9, true);
    this.smoothed = false;

    // set pivot to center
    this.anchor.setTo(0.5, 0.5);

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

    this.flinch = 800;
    this.invincible = false;
    this.flashTimer = 20;
    this.maxHealth = 5;
    this.health = 5;

    this.mana = 3;

    // create the health bar
    this.hearts = []
    for (i = 0; i < this.maxHealth; ++i){
        this.hearts[i] = this.game.add.image(30*i + 10, 3, 'heart');
        this.hearts[i].height = 20;
        this.hearts[i].width = 22;
    }

    // mana bar
    this.bottles = []
    for (i = 0; i < this.mana; ++i){
        this.bottles[i] = this.game.add.image(30*i + 10, 25, 'bottle');
        this.bottles[i].height = 20;
        this.bottles[i].width = 14;
    }

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

    // flash if invincible (after a hit)
    this.flash(this);

    // set up min and max mvt speed
    if ((this.cursors.left.isDown || this.cursors.right.isDown) &&
        (this.cursors.up.isDown || this.cursors.down.isDown)) {
        this.body.maxVelocity.setTo(this.DIAG_SPEED, this.DIAG_SPEED); // x, y
    } else {
        this.body.maxVelocity.setTo(this.MAX_SPEED, this.MAX_SPEED); // x, y
    }

    // movement and controls
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

    // attack/spell controls
    if (this.game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR)) {
        this.sword.swing();
    }

    if (this.game.input.keyboard.isDown(Phaser.Keyboard.W)) {
        PlayerSpells.whirlpool.cast(this.x, this.y); // drop at current position
    }

    // update health bar
    if (this.hearts.length < this.health){
        for (i = this.hearts.length; i < this.health; ++i){
            this.hearts[i] = this.game.add.image(30*i + 10, 3, 'heart');
            this.hearts[i].height = 20;
            this.hearts[i].width = 22;
        }
    } else {
        while (this.hearts.length > this.health){
            var heart = this.hearts.pop()
            heart.kill();
        }
    }

    // update mana bar
    if (this.bottles.length < this.mana){
        for (i = this.bottles.length; i < this.mana; ++i){
            this.bottles[i] = this.game.add.image(30*i + 10, 25, 'bottle');
            this.bottles[i].height = 20;
            this.bottles[i].width = 14;
        }
    } else {
        while (this.bottles.length > this.mana){
            var heart = this.bottles.pop()
            heart.kill();
        }
    }
};

WarriorPlayer.prototype.takeDamage = alexTown.takeDamage;

WarriorPlayer.prototype.flash = alexTown.flash;

// player sword class definition
var WarriorSword = function(game) {
    this.game = game;
    Phaser.Sprite.call(this, game, 18, -10, 'warriorsword');
    game.physics.enable(this, Phaser.Physics.ARCADE);
    this.animations.add('swing');
    this.smoothed = false;

    // center pivot on middle of sprite
    this.anchor.setTo(0.5, 0.5);

    // basic attack logic
    this.nextSwing = 0;
    this.swingRate = 180; // sword swing cool down
    this.damage = 1;

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
    this.animations.play('swing', 40, false, true); // kill on animation complete

    // set cooldown
    this.nextSwing = this.game.time.time + this.swingRate;
};
