/** 
Main game definition

Scaling comes from tutorial found at:
	http://www.photonstorm.com/phaser/pixel-perfect-scaling-a-phaser-game
**/

var GameState = function(game) {
};

// Load images and sounds
GameState.prototype.preload = function() {
	this.game.load.image('ground', 'assets/ground.png');
	this.game.load.spritesheet('player', 'assets/warrior.png', 8, 12);
};

// Set up game canvas
GameState.prototype.init = function() {
	//physics
	this.physics.startSystem(Phaser.Physics.ARCADE);

	//  Hide the un-scaled game canvas
	game.canvas.style['display'] = 'none';

	//  Create our scaled canvas. It will be the size of the game * whatever scale value you've set
	pixel.canvas = Phaser.Canvas.create(game.width * pixel.scale, game.height * pixel.scale);

	//  Store a reference to the Canvas Context
	pixel.context = pixel.canvas.getContext('2d');

	//  Add the scaled canvas to the DOM
	Phaser.Canvas.addToDOM(pixel.canvas);

	//  Disable smoothing on the scaled canvas
	Phaser.Canvas.setSmoothingEnabled(pixel.context, false);

	//  Cache the width/height to avoid looking it up every render
	pixel.width = pixel.canvas.width;
	pixel.height = pixel.canvas.height;
}

// Set up gameplay
GameState.prototype.create = function() {

	// set stage background to sky color
	this.game.stage.backgroundColor = 0xF1CE86;

	// dimensional constants
	this.GROUND_SPRITE_SIZE = 16;
	this.PLAYER_SPRITE_HEIGHT = 12;
	this.PLAYER_SPRITE_WIDTH = 8;

	// movement constants
	this.MAX_SPEED = 75;
	this.ACCELERATION = 500;
	this.DRAG = 350;

	// create player sprite
	this.player = this.game.add.sprite(
		this.PLAYER_SPRITE_WIDTH * 2,
		(this.game.height / 2) + (this.PLAYER_SPRITE_HEIGHT / 2),
		'player'
	);

	this.player.animations.add('run', [0,1,2,3], 10, true);

	// enable physics for player
	this.game.physics.enable(this.player, Phaser.Physics.ARCADE);

	// make player stay in screen
	this.player.body.collideWorldBounds = true;

	// set up min and max mvt speed
	this.player.body.maxVelocity.setTo(this.MAX_SPEED, this.MAX_SPEED); // x, y

	// add drag to the player
	this.player.body.drag.setTo(this.DRAG, this.DRAG); // x, y

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

	// set up keyboard input
	this.cursors = game.input.keyboard.createCursorKeys();
};

GameState.prototype.update = function() {
	//object collision and movement logic
	this.game.physics.arcade.collide(this.player, this.ground);

	/** PLAYER LOGIC **/
	this.player.animations.play('run');

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
};

GameState.prototype.render = function() {
	// Every loop render the un-scaled game canvas to the displayed scaled canvas:
	pixel.context.drawImage(game.canvas, 0, 0, game.width, game.height, 0, 0, pixel.width, pixel.height);
};

// Create game canvas
var game = new Phaser.Game(400, 330, Phaser.CANVAS, '');

// Create reference to scaled game canvas
var pixel = { scale: 2, canvas: null, context: null, width: 0, height: 0};

// Create game state
game.state.add('game', GameState, true);