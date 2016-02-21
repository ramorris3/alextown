/** 
Main game definition
**/

var GameState = function(game) {
};

// Load images and sounds
GameState.prototype.preload = function() {
	this.GROUND_SPRITE_SIZE = 48;
	this.game.load.image('ground', 'assets/ground1.png');

	this.PLAYER_SPRITE_WIDTH = 24;
	this.PLAYER_SPRITE_HEIGHT = 36;
	this.game.load.spritesheet('warrior', 'assets/warrior.png',
		this.PLAYER_SPRITE_WIDTH,
		this.PLAYER_SPRITE_HEIGHT);

    this.ZOMBIE_SPRITE_WIDTH = 18;
    this.ZOMBIE_SPRITE_HEIGHT = 27;
    this.game.load.spritesheet('zombie', 'assets/zombie.png',
        this.ZOMBIE_SPRITE_WIDTH,
        this.ZOMBIE_SPRITE_HEIGHT);

    this.ROOK_SPRITE_WIDTH = 24;
    this.ROOK_SPRITE_HEIGHT = 36;
    this.game.load.spritesheet('rook', 'assets/rook.png',
        this.ROOK_SPRITE_WIDTH,
        this.ROOK_SPRITE_HEIGHT);

    this.ARROW_SPRITE_WIDTH = 24;
    this.ARROW_SPRITE_HEIGHT = 3;
    this.game.load.spritesheet('arrow', 'assets/arrow.png',
        this.ARROW_SPRITE_WIDTH,
        this.ARROW_SPRITE_HEIGHT);
};


// Set up gameplay
GameState.prototype.create = function() {

	// set stage background to sky color
	this.game.stage.backgroundColor = 0x444444;

	// create player sprite
	this.player = this.game.add.existing(
		new WarriorPlayer(this.game,
            this.PLAYER_SPRITE_WIDTH * 2,
            (this.game.height / 2) + (this.PLAYER_SPRITE_HEIGHT / 2))
    );

    // create zombie sprite
    this.chomper_swarm = this.game.add.group();
    for (var y = 0; y < this.game.height; y += this.ZOMBIE_SPRITE_HEIGHT) {
        var chomper = this.game.add.existing(
            new Follower(this.game, this.game.width, y, this.player)
            );
        this.chomper_swarm.add(chomper);
    }

    this.charger_swarm = this.game.add.group();
    for (var y = 0; y < this.game.height; y += this.ZOMBIE_SPRITE_HEIGHT) {
        var charger = this.game.add.existing(
            new Charger(this.game, this.game.width, y)
            );
        this.charger_swarm.add(charger)
    }

	// create ground
	this.ground = this.game.add.group();
	for (var x = 0; x < this.game.width; x += this.GROUND_SPRITE_SIZE) {
		//add the ground blocks, enable physics on each, make immovable
		var groundBlock = this.game.add.sprite(x, this.game.height - this.GROUND_SPRITE_SIZE, 'ground');
		this.game.physics.enable(groundBlock, Phaser.Physics.ARCADE);
		groundBlock.body.immovable = true;
		groundBlock.body.allowGravity = false;
		this.ground.add(groundBlock);
	}

	// capture certain keys to prevent default actions in browser (HTML 5 only)
	this.game.input.keyboard.addKeyCapture([
		Phaser.Keyboard.LEFT,
		Phaser.Keyboard.RIGHT,
		Phaser.Keyboard.UP,
		Phaser.Keyboard.DOWN
       ]);
};

GameState.prototype.update = function() {
	//object collision and movement logic
	this.game.physics.arcade.collide(this.player, this.ground);
    this.game.physics.arcade.collide(this.chomper_swarm, this.chomper_swarm);
<<<<<<< HEAD
    this.game.physics.arcade.collide(this.rook_troop, this.rook_troop);

    /** PLAYER LOGIC **/
    this.player.animations.play('run');

    // set up min and max mvt speed
    if ((this.cursors.left.isDown || this.cursors.right.isDown) &&
        (this.cursors.up.isDown || this.cursors.down.isDown)) {
        this.player.body.maxVelocity.setTo(this.DIAG_SPEED, this.DIAG_SPEED); // x, y
    } else {
        this.player.body.maxVelocity.setTo(this.MAX_SPEED, this.MAX_SPEED); // x, y
    }


    if (this.cursors.left.isDown) {
      this.player.body.acceleration.x = -this.ACCELERATION;
  } else if (this.cursors.right.isDown) {
      this.player.body.acceleration.x = this.ACCELERATION;
  } else {
      this.player.body.acceleration.x = 0;
  }

  if (this.cursors.up.isDown) {
      this.player.body.acceleration.y = -this.ACCELERATION;
  } else if (this.cursors.down.isDown) {
      this.player.body.acceleration.y = this.ACCELERATION;
  } else {
      this.player.body.acceleration.y = 0;
  }
=======
>>>>>>> refactored player to warriorPlayer.js
};


// Create game canvas
var game = new Phaser.Game(800, 600, Phaser.CANVAS, '');

// Create game state
game.state.add('game', GameState, true);