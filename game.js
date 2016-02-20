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
	// all sprites are square tiles ??

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
};

GameState.prototype.render = function() {
	// Every loop render the un-scaled game canvas to the displayed scaled canvas:
	pixel.context.drawImage(game.canvas, 0, 0, game.width, game.height, 0, 0, pixel.width, pixel.height);
};

// Create game canvas
var game = new Phaser.Game(200, 165, Phaser.CANVAS, '');

// Create reference to scaled game canvas
var pixel = { scale: 4, canvas: null, context: null, width: 0, height: 0};

// Create game state
game.state.add('game', GameState, true);