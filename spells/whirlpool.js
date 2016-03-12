var Whirlpool = function(game) {
    // init sprite and animations
    this.game = game;
    Phaser.Sprite.call(this, this.game, 0, 0, 'whirlpool');
    this.animations.add('spin');

    //set physics for collision handling
    this.game.physics.enable(this, Phaser.Physics.ARCADE);
    //set hitbox so it will suck enemies outside of its hitbox
    this.body.setSize(220,220);

    //center anchor on middle of sprite (enemies will be sucked to center of sprite)
    this.anchor.setTo(0.5, 0.5);

    //cooldown and timing vars
    this.nextAttack = 0;
    this.cooldown = 8000;
    this.spinTime = 5000;
    this.spinStart = 0;

    // attack effects
    this.suckSpeed = 180; //px per frame
    this.currentEnemies = [];

    //initially inactive
    this.kill();
};

Whirlpool.prototype = Object.create(Phaser.Sprite.prototype);
Whirlpool.prototype.constructor = Whirlpool;

Whirlpool.prototype.update = function() {
    // if cast is over, go inactive
    if (this.game.time.time > this.spinStart + this.spinTime) {
        //"spit" enemies out ?

        //unstun enemies that you sucked in
        for (var i = 0; i < this.currentEnemies.length; i++) {
            this.currentEnemies[i].unstun();
            // reset inWhirlpool flag
            this.currentEnemies[i].inWhirlpool = false;
        }
        this.currentEnemies = [];
        
        //go inactive
        this.kill();
        return;
    }

    // play animation
    this.animations.play('spin', 4, true);
};

Whirlpool.prototype.cast = function(x, y) {
    // cooldown still active
    if (this.game.time.time < this.nextAttack) {
        return;
    }

    // place on the floor
    this.reset(x,y);

    // revive whirlpool and start spinning
    this.revive();

    // set timer
    this.spinStart = this.game.time.time;

    // set cooldown
    this.nextAttack = this.game.time.time + this.cooldown;
};

Whirlpool.prototype.suck = function(enemy) {
    //stun enemy, and keep track of who you've stunned
    if (!enemy.inWhirlpool) { // setting a new property in enemy as a flag
        this.currentEnemies.push(enemy);
        enemy.stun();
        // flag to make sure you don't constantly add enemies to this.currentEnemies
        enemy.inWhirlpool = true; 
    }

    //suck enemy in
    var rotation = this.game.math.angleBetween(
        enemy.x, enemy.y,
        this.x, this.y);

    enemy.body.velocity.setTo(
        Math.cos(rotation) * this.suckSpeed,
        Math.sin(rotation) * this.suckSpeed
    );

};
