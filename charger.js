var Charger = function(game, x, y, target) {
    Phaser.Sprite.call(this, game, x, y, 'charger');

    this.animations.add('charge', [0,1,2,3], 10, true);
    this.smoothed = false;

    // Set the pivot point for this sprite to the center
    this.anchor.setTo(0.5, 0.5);

    //set up damage logic
    this.invincible = false;
    this.flashTimer = 20;
    this.health = 4;

    // Enable physics on this object
    this.game.physics.enable(this, Phaser.Physics.ARCADE);

    // Define constants that affect motion
    this.MAX_SPEED = 100; // pixels/second
    this.MIN_DISTANCE = 4; // pixels\

        // State
    this.currentstate = this.enemyWanderState;
    this.noticeTarget = 500;
    this.target = target;

};

Charger.prototype = Object.create(Phaser.Sprite.prototype);
Charger.prototype.constructor = Charger;

Charger.prototype.update = function() {
    //Check if offscreen and destroy
    if (this.x < -this.width){
        this.destroy();
        return;
    }
    this.currentstate();
    // flash if invincible (after a hit)
    this.flash(this);
};

Charger.prototype.enemyWanderState = function() {
    // play animation
    this.animations.play('charge');
    // If the distance > MIN_DISTANCE then move
    if ((this.body.velocity.x > this.MAX_SPEED || this.body.velocity.x < -this.MAX_SPEED) && this.game.input.keyboard.isDown(Phaser.Keyboard.W)) {
        this.body.velocity.setTo(this.body.velocity.x, this.body.velocity.y);
    }
    else {
        this.body.velocity.setTo(-100, 0);
    }
    var distance = this.game.math.distance(this.x, this.y, this.target.x, this.target.y);
    if (distance < this.noticeTarget && this.x > this.target.x) {
        this.currentstate = this.enemyChargeState;
    }
};

Charger.prototype.enemyChargeState = function() {
    // play animation
    this.animations.play('charge');
    // Move
    this.body.velocity.setTo(-200, 0);
    if ((this.body.velocity.x > this.MAX_SPEED || this.body.velocity.x < -this.MAX_SPEED) && this.game.input.keyboard.isDown(Phaser.Keyboard.W)) {
        this.body.velocity.setTo(this.body.velocity.x, this.body.velocity.y);
    }
    else {
        this.body.velocity.setTo(-200, 0);
    }
};


Charger.prototype.takeDamage = alexTown.takeDamage;

Charger.prototype.flash = alexTown.flash;
