var Charger = function(game, x, y) {
    Phaser.Sprite.call(this, game, x, y, 'charger');

    this.animations.add('charge', [0,1,2,3], 10, true);
    this.smoothed = false;

    // Set the pivot point for this sprite to the center
    this.anchor.setTo(0.5, 0.5);

    // Enable physics on this object
    this.game.physics.enable(this, Phaser.Physics.ARCADE);

    // Define constants that affect motion
    this.MAX_SPEED = 100; // pixels/second
    this.MIN_DISTANCE = 4; // pixels
};

Charger.prototype = Object.create(Phaser.Sprite.prototype);
Charger.prototype.constructor = Charger;

Charger.prototype.update = function() {
    //Check if offscreen and destroy
    if (this.x < -this.width){
        this.destroy()
        return;
    }

    // play zombie animation
    this.animations.play('charge');

    // If the distance > MIN_DISTANCE then move
    if ((this.body.velocity.x > this.MAX_SPEED || this.body.velocity.x < -this.MAX_SPEED) && this.game.input.keyboard.isDown(Phaser.Keyboard.W)) {
        this.body.velocity.setTo(this.body.velocity.x, this.body.velocity.y);
    }
    else {
        this.body.velocity.setTo(-100, 0);
    }
};
