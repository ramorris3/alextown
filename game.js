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
	this.game.load.spritesheet('player', 'assets/warrior.png',
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

	// movement constants
	this.MAX_SPEED = 280;
    this.DIAG_SPEED = this.MAX_SPEED / Math.sqrt(2);
	this.ACCELERATION = 1500;
	this.DRAG = 1450;

	// create player sprite
	this.player = this.game.add.sprite(
		this.PLAYER_SPRITE_WIDTH * 2,
		(this.game.height / 2) + (this.PLAYER_SPRITE_HEIGHT / 2),
		'player'
	);

	this.player.animations.add('run', [0,1,2,3], 10, true);
    this.player.smoothed = false;

    // create arrow group
    this.arrowpool = this.game.add.group();
    for (var i = 0; i<100; i++){
        var arrow = this.game.add.existing(
            new Arrow(this.game, 0, 0)
        );
        arrow.kill();
        this.arrowpool.add(arrow);
    }

    //create rook sprites
    this.rook_troop = this.game.add.group();
    for (var z = 0; z < this.game.height; z += this.ROOK_SPRITE_HEIGHT) {
        var rook = this.game.add.existing(
            new Rook(this.game, this.game.width - this.ROOK_SPRITE_WIDTH, z, this.player, this.arrowpool)
        );
        rook.animations.add('hop', [0,1,2,3], 10, true);
        rook.smoothed = false;
        this.rook_troop.add(rook);
    }


    // create zombie sprites
    this.chomper_swarm = this.game.add.group();
    for (var y = 0; y < this.game.height; y += this.ZOMBIE_SPRITE_HEIGHT) {
        var chomper = this.game.add.existing(
            new Follower(this.game, this.game.width - 5 * this.ZOMBIE_SPRITE_WIDTH, y, this.player)
        );
        chomper.animations.add('chomp', [0,1,2,3], 10, true);
        chomper.smoothed = false;
        this.chomper_swarm.add(chomper)
    }






	// enable physics for player
	this.game.physics.enable(this.player, Phaser.Physics.ARCADE);

	// make player stay in screen
	this.player.body.collideWorldBounds = true;

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
    this.game.physics.arcade.collide(this.chomper_swarm, this.chomper_swarm);
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
};

var Follower = function(game, x, y, target) {
    Phaser.Sprite.call(this, game, x, y, 'zombie');

    // Save the target that this Follower will follow
    // The target is any object with x and y properties
    this.target = target;

    // Set the pivot point for this sprite to the center
    this.anchor.setTo(0.5, 0.5);

    // Enable physics on this object
    this.game.physics.enable(this, Phaser.Physics.ARCADE);

    // Define constants that affect motion
    this.MAX_SPEED = 100; // pixels/second
    this.MIN_DISTANCE = 4; // pixels
};

// Followers are a type of Phaser.Sprite
Follower.prototype = Object.create(Phaser.Sprite.prototype);
Follower.prototype.constructor = Follower;

Follower.prototype.update = function() {
    // play zombie animation
    this.animations.play('chomp');

    // Calculate distance to target
    var distance = this.game.math.distance(this.x, this.y, this.target.x, this.target.y);

    // If the distance > MIN_DISTANCE then move
    if (distance > this.MIN_DISTANCE) {
        // Calculate the angle to the target
        var rotation = this.game.math.angleBetween(this.x, this.y, this.target.x, this.target.y);

        // Calculate velocity vector based on rotation and this.MAX_SPEED
        this.body.velocity.x = Math.cos(rotation) * this.MAX_SPEED;
        this.body.velocity.y = Math.sin(rotation) * this.MAX_SPEED;
    } else {
        this.body.velocity.setTo(0, 0);
    }
};


// rook class definition
var Rook = function(game, x, y, target, ammo) {
    Phaser.Sprite.call(this, game, x, y, 'rook');

    // Save the target that this Follower will follow
    // The target is any object with x and y properties
    this.target = target;

    // Set the pivot point for this sprite to the center
    this.anchor.setTo(0.5, 0.5);

    // Enable physics on this object
    this.game.physics.enable(this, Phaser.Physics.ARCADE);

    // Define constants that affect motion
    this.MAX_SPEED = 100; // pixels/second
    this.MIN_DISTANCE = 300; // pixels

    // Weapon
    this.reload_stat = 50;
    this.reload_count = 50;
    this.ammo = ammo;

};

// Followers are a type of Phaser.Sprite
Rook.prototype = Object.create(Phaser.Sprite.prototype);
Rook.prototype.constructor = Rook;

Rook.prototype.update = function() {
    // play rook animation
    this.animations.play('hop');


    // Calculate distance to target
    var distance = this.game.math.distance(this.x, this.y, this.target.x, this.target.y);
    // Calculate the angle to the target
    var rotation = this.game.math.angleBetween(this.x, this.y, this.target.x, this.target.y);
    // If the distance > MIN_DISTANCE then move
    if (distance > this.MIN_DISTANCE) {
        // Calculate velocity vector based on rotation and this.MAX_SPEED
        this.body.velocity.x = Math.cos(rotation) * this.MAX_SPEED;
        this.body.velocity.y = Math.sin(rotation) * this.MAX_SPEED;
        // otherwise shoot arrow
    } else {
        this.body.velocity.setTo(0, 0);
    }
    if (this.reload_count >= this.reload_stat) {
        var arrow = this.ammo.getFirstDead();
        if (arrow === null || arrow === undefined) return;
        arrow.revive();
        arrow.checkWorldBounds = true;
        arrow.outOfBoundsKill = true;
        arrow.reset(this.x, this.y);
        arrow.body.velocity.x = Math.cos(rotation) * arrow.SPEED;
        arrow.body.velocity.y = Math.sin(rotation) * arrow.SPEED;
        this.reload_count = 0;
    } else {
        this.reload_count++;
    }
};

// arrow class definition
var Arrow = function(game, x, y) {
    Phaser.Sprite.call(this, game, x, y, 'arrow');
    this.game.physics.enable(this, Phaser.Physics.ARCADE);
    this.SPEED = 300;
};

Arrow.prototype = Object.create(Phaser.Sprite.prototype);
Arrow.prototype.constructor = Arrow;


// Create game canvas
var game = new Phaser.Game(800, 600, Phaser.CANVAS, '');

// Create game state
game.state.add('game', GameState, true);