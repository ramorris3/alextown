var WarriorPlayer = function(game, x, y) {
    this.game = game;

    Phaser.Sprite.call(this, this.game, x, y, 'warrior');

    this.animations.add('run', [0,1,2,3], 5, true);
    this.smoothed = false;

    // add player sword
    this.sword = this.game.add.existing(
            new WarriorSword(this.game)
        );
    this.addChild(this.sword);

    this.whirlPool = this.game.add.existing(
            new magicWhirlpool(this.game, this)
        );
    //this.addChild(this.whirlPool);

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

    if (this.game.input.keyboard.isDown(Phaser.Keyboard.W)) {
        this.whirlPool.cast(this.game, this);
    }
};

// player sword class definition
var WarriorSword = function(game) {
    this.game = game;
    Phaser.Sprite.call(this, game, 33, -20, 'warriorsword');
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

var magicWhirlpool = function(game) {
    this.game = game;
    //Call a null sprite that is used for getting position
    Phaser.Sprite.call(this, game, 0, 0, '');

    //Position constants 
    const posx = this.x;
    const posy = this.y;

    //Cooldown 
    this.nextAttack = 0;
    this.coolDown = 15000;
    var endtime;

    this.kill();
};

magicWhirlpool.prototype = Object.create(Phaser.Sprite.prototype);
magicWhirlpool.prototype.constructor = magicWhirlpool;

magicWhirlpool.prototype.cast = function(game, target) {
    this.game = game;
    if (this.game.time.time < this.coolDown) {
        return;
    }

    //Get casting location for whirlpool
    const posx = target.x;
    const posy = target.y;
    //Animation for whirlpool ++Needs to be updated to a whirlpool
    var pool = game.add.sprite(posx, posy, 'warriorsword');
    var movepool = pool.animations.add('swing', [0,1,2,3,4,5,6,7,8,9], 30, true);
    //add loop to hold enemies
    game.time.events.loop(1, animateWhirlpool, this, this.game, this, posx, posy, this.game.time.time, pool);

    // Cooldown
    this.nextAttack = this.game.time.time + this.coolDown;
};

function animateWhirlpool(game, enemy, posx, posy, startTime, pool) {
        //Makes loop last 8 seconds
        if (game.time.time >= startTime + 5000) {
            pool.kill();
            game.time.events.remove(this);
            return;
        }
        pool.animations.play('swing', 30, true);

        // Holds enemies in place
        this.game.enemygroup.forEachExists(MoveEnemy, enemy, posx, posy, this);
}

//Runs for each enemy
var MoveEnemy = function(enemy, posx, posy) {
    var distance = this.game.math.distance(enemy.x, enemy.y, posx, posy);
    //If within distance hold enemy
    if (distance < 150) {
        var rotation = this.game.math.angleBetween(enemy.x, enemy.y, posx, posy);
        const SPEED = 300;

        enemy.body.velocity.x = Math.cos(rotation) * SPEED;
        enemy.body.velocity.y = Math.sin(rotation) * SPEED;    
    }
};