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
    this.game.load.spritesheet('warriorsword', 'assets/warriorsword.png',
        36, 36);

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

    this.enemygroup = this.game.add.group();

    // create player sprite
    this.player = this.game.add.existing(
        new WarriorPlayer(this.game,
            this.PLAYER_SPRITE_WIDTH * 2,
            (this.game.height / 2) + (this.PLAYER_SPRITE_HEIGHT / 2))
    );

    // create arrow pool for rooks
    this.arrowpool = this.game.add.group();
    for (var i = 0; i<100; i++) {
        var arrow = this.game.add.existing(
            new Arrow(this.game, 0, 0)
        );
        this.arrowpool.add(arrow);
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

    this.level = lvl0;
    this.levelMap = lvl0.map.match(/\S+/g);
};

GameState.prototype.update = function() {
    //object collision and movement logic
    this.game.step();
    // every 25 frames send in a new wave of guys
    if (!(this.game.stepCount % 25)) {
        if (this.levelMap.length){
            var wave = this.levelMap.shift().split('')
            for (var i = 0; i < wave.length; ++i) {
                var x = this.game.width + 50;
                var y = i*50+25;
                switch (wave[i]) {
                    case 'Z':
                        var chomper = this.game.add.existing(
                            new Chomper(this.game, x, y, this.player)
                        );
                        this.enemygroup.add(chomper);
                        break;
                    case 'R':
                        var rook = this.game.add.existing(
                            new Rook(this.game, x, i*50+25, this.player, this.arrowpool)
                        );
                        this.enemygroup.add(rook);
                        break;
                    case 'C':
                        var charger = this.game.add.existing(
                            new Charger(this.game, x, i*50+25)
                        );
                        this.enemygroup.add(charger);
                        break;
                }
            }
        }
    }
    this.game.physics.arcade.collide(this.player, this.ground);
    this.game.physics.arcade.collide(this.enemygroup, this.enemygroup);
};


// Create game canvas
var game = new Phaser.Game(800, 600, Phaser.CANVAS, '');

// Create game state
game.state.add('game', GameState, true);