/** 
Main game definition
**/

var GameState = function(game) {
};

// Load images and sounds
GameState.prototype.preload = function() {
    // game font
    game.load.bitmapFont('carrier_command', 'assets/carrier_command.png', 'assets/carrier_command.xml');

    // tiles
    this.game.load.image('ground', 'assets/groundtile.png');
    this.game.load.image('rug', 'assets/rugtile.png');

    // sprites/images
    this.PLAYER_SPRITE_WIDTH = 30;
    this.PLAYER_SPRITE_HEIGHT = 42;
    this.game.load.spritesheet('warrior', 'assets/warrior.png',
        this.PLAYER_SPRITE_WIDTH,
        this.PLAYER_SPRITE_HEIGHT);
    this.game.load.spritesheet('warriorsword', 'assets/warriorsword.png',
        144, 99);
    this.game.load.spritesheet('whirlpool', 'assets/whirlpoolsprite.png', 150, 150);

    this.CHOMPER_SPRITE_WIDTH = 24;
    this.CHOMPER_SPRITE_HEIGHT = 36;
    this.game.load.spritesheet('chomper', 'assets/chomper.png',
        this.CHOMPER_SPRITE_WIDTH,
        this.CHOMPER_SPRITE_HEIGHT);

    this.CHARGER_SPRITE_WIDTH = 36;
    this.CHARGER_SPRITE_HEIGHT = 36;
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
    //GRAPHICS ARE RENDERED IN THE ORDER IN WHICH THEY ARE ADDED TO THE GAME */
    /*
        1. Surroundings
        2. Whirlpool
        3. Player
        4. Enemies
    */

    // make castle surroundings (lvl 1)
    this.castleStage = alexTown.makeCastleStage(this.game);


    // load up the xp meter
    game.playerXP = 0;
    game.nextLevel = 100;
    game.xpMeter = game.add.bitmapText(850, 10, 'carrier_command', '0/100', 20);

    // init player's spells
    PlayerSpells.whirlpool = this.game.add.existing(
            new Whirlpool(this.game)
        );

    // create player sprite
    this.player = this.game.add.existing(
        new WarriorPlayer(this.game,
            this.PLAYER_SPRITE_WIDTH * 2,
            (this.game.height / 2) - (this.PLAYER_SPRITE_HEIGHT / 2))
    );

    //init enemies group
    Enemies.enemyGroup = game.add.physicsGroup(Phaser.Physics.ARCADE);;

    // set stage background to sky color
    this.game.stage.backgroundColor = 0x444444;

    // create arrow pool for rooks
    EnemyWeapons.arrowPool = this.game.add.group();
    for (var i = 0; i<100; i++) {
        var arrow = this.game.add.existing(
            new Arrow(this.game, 0, 0)
        );
        EnemyWeapons.arrowPool.add(arrow);
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
            var wave = this.levelMap.shift();
            for (var i = 0; i < wave.length; ++i) {
                var x = this.game.width + 50;
                var y = i*39+65;
                switch (wave[i]) {
                    case 'Z':
                        var chomper = this.game.add.existing(
                            new Chomper(this.game, x, y, this.player)
                        );
                        Enemies.enemyGroup.add(chomper);
                        break;
                    case 'R':
                        var rook = this.game.add.existing(
                            new Rook(this.game, x, y, this.player, EnemyWeapons.arrowPool)
                        );
                        Enemies.enemyGroup.add(rook);
                        break;
                    case 'C':
                        var charger = this.game.add.existing(
                            new Charger(this.game, x, y, this.player)
                        );
                        Enemies.enemyGroup.add(charger);
                        break;
                }
            }
        }
    }

    //collisions with castle stage tiles (walls, not rug)
    this.game.physics.arcade.collide(this.player, this.castleStage);
    this.game.physics.arcade.collide(Enemies.enemyGroup, this.castleStage);

    // player/enemy, enemy/enemy collision handling
    // enemies are solid
    this.game.physics.arcade.collide(Enemies.enemyGroup);
    // all enemies damaged by sword
    this.game.physics.arcade.overlap(this.player.sword, Enemies.enemyGroup, onPlayerSwordHit, null, this);
    // enemies sucked by whirlpool
    this.game.physics.arcade.overlap(PlayerSpells.whirlpool, Enemies.enemyGroup, onWhirlpoolHit, null, this);
    // player damaged by enemies/arrows
    this.game.physics.arcade.overlap(this.player, Enemies.enemyGroup, onPlayerHit, null, this);
    this.game.physics.arcade.overlap(this.player, EnemyWeapons.arrowPool, onEnemyWeaponHit, null, this);

};

// custom collision handling
var onPlayerSwordHit = function(weapon, enemy) {
    enemy.takeDamage(enemy, weapon.damage, 200); //200 flinch for all for now
};
var onPlayerHit = function(player, enemy) {
    //player.takeDamage(player, 1, 800); // only loses one HP for now
    enemy.damagePlayer(player);
};
var onEnemyWeaponHit = function(player, weapon) {
    weapon.damageTarget(player);
};
var onWhirlpoolHit = function(whirlpool, enemy) {
    whirlpool.suck(enemy);
};

// Create game canvas
var game = new Phaser.Game(1000, 500, Phaser.CANVAS, '');

// Create game state
game.state.add('game', GameState, true);
