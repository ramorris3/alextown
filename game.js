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

    this.CHOMPER_SPRITE_WIDTH = 18;
    this.CHOMPER_SPRITE_HEIGHT = 27;
    this.game.load.spritesheet('chomper', 'assets/chomper.png',
        this.CHOMPER_SPRITE_WIDTH,
        this.CHOMPER_SPRITE_HEIGHT);

    this.CHARGER_SPRITE_WIDTH = 18;
    this.CHARGER_SPRITE_HEIGHT = 27;
    this.game.load.spritesheet('charger', 'assets/charger.png',
        this.CHARGER_SPRITE_WIDTH,
        this.CHARGER_SPRITE_HEIGHT);

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

    // create chomper sprites
    this.chomper_swarm = this.game.add.group();
    for (var y = 0; y < this.game.height; y += this.CHOMPER_SPRITE_HEIGHT) {
        var chomper = this.game.add.existing(
            new Chomper(this.game, this.game.width, y, this.player)
            );
        this.chomper_swarm.add(chomper);
    }

    // create charger sprites
    this.charger_swarm = this.game.add.group();
    for (var y = 0; y < this.game.height; y += this.CHARGER_SPRITE_HEIGHT) {
        var charger = this.game.add.existing(
            new Charger(this.game, this.game.width, y)
            );
        this.charger_swarm.add(charger);
    }

    // create arrow pool for rooks
    this.arrowpool = this.game.add.group();
    for (var i = 0; i<100; i++) {
        var arrow = this.game.add.existing(
            new Arrow(this.game, 0, 0)
        );
        this.arrowpool.add(arrow);
    }

    // create rooks
    this.rook_troop = this.game.add.group();
    for (var z = 0; z < this.game.height; z += this.ROOK_SPRITE_HEIGHT) {
        var rook = this.game.add.existing(
            new Rook(this.game, this.game.width - this.ROOK_SPRITE_WIDTH, z, this.player, this.arrowpool)
        );
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

    this.game.level = lvl0;
};

GameState.prototype.update = function() {
    //object collision and movement logic
    this.game.physics.arcade.collide(this.player, this.ground);
    this.game.physics.arcade.collide(this.chomper_swarm, this.chomper_swarm);
};


// Create game canvas
var game = new Phaser.Game(800, 600, Phaser.CANVAS, '');

// Create game state
game.state.add('game', GameState, true);