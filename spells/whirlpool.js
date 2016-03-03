var Whirlpool = function(game) {
    // init sprite and animations
    this.game = game;
    Phaser.Sprite.call(this, this.game, 0, 0, 'whirlpool');
    this.animations.add('spin');

    //center anchor on middle of sprite (enemies will be sucked to center of sprite)
    this.anchor.setTo(0.5, 0.5);

    //cooldown and timing vars
    this.nextAttack = 0;
    this.cooldown = 8000;
    this.spinTime = 5000;
    this.spinStart = 0;
    this.spinning = false;

    // attack effects
    this.suckRadius = 150;
    this.suckSpeed = .5; //px per frame

    //initially inactive
    this.kill();
};

Whirlpool.prototype = Object.create(Phaser.Sprite.prototype);
Whirlpool.prototype.constructor = Whirlpool;

Whirlpool.prototype.cast = function(x, y) {
    // cooldown still active
    if (this.game.time.time < this.nextAttack) {
        return;
    }

    // revive whirlpool and start spinning
    this.revive();
    this.spinStart = this.game.time.time;
    this.spinning = true;

    // place on the floor
    this.x = x;
    this.y = y;

    // send to back so it will be drawn beneath stuff
    for (var i = 0; i < 4; i++) {
        this.moveDown();
    } // send to back not working!!! Not sure why - http://phaser.io/docs/2.4.6/Phaser.Sprite.html#sendToBack

    // set cooldown
    this.nextAttack = this.game.time.time + this.cooldown;
};

Whirlpool.prototype.spin = function() {
    // if cast is over, go inactive
    if (this.game.time.time > this.spinStart + this.spinTime) {
        this.kill();
        this.spinning = false;
        return;
    }

    // play animation
    this.animations.play('spin', 4, true);

    // suck in enemies without damaging them
    for (var i = 0; i < this.game.allEnemies.length; i++) {
        var that = this;
        this.game.allEnemies[i].forEachExists(that.suck, this);
    }
};

Whirlpool.prototype.suck = function(enemy) {
    // get enemy distance from whirlpool
    var dist = this.game.math.distance(enemy.x, enemy.y, this.x, this.y);
    // if within distance, suck in enemy
    if (dist < this.suckRadius) {
        var rotation = this.game.math.angleBetween(
            enemy.x, enemy.y,
            this.x, this.y);

        enemy.x += Math.cos(rotation) * this.suckSpeed;
        enemy.y += Math.sin(rotation) * this.suckSpeed;
    }

}

Whirlpool.prototype.update = function() {
    // if active, spin and suck enemies in
    if (this.spinning) {
        this.spin();
    }
};

