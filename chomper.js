var Chomper = function(game, x, y, target) {
    this.game = game;
    Phaser.Sprite.call(this, game, x, y, 'chomper');

    this.animations.add('chomp', [0,1,2,3], 10, true);
    this.smoothed = false;

    // Save the target that this Chomper will follow
    // The target is any object with x and y properties
    this.target = target;
    this.invincible = false;
    this.flashTimer = 20;
    this.health = 4;

    // Set the pivot point for this sprite to the center
    this.anchor.setTo(0.5, 0.5);

    // Enable physics on this object
    this.game.physics.enable(this, Phaser.Physics.ARCADE);

    // Define constants that affect motion
    this.MAX_SPEED = 100; // pixels/second
    this.MIN_DISTANCE = 4; // pixels
};

// Chompers are a type of Phaser.Sprite
Chomper.prototype = Object.create(Phaser.Sprite.prototype);
Chomper.prototype.constructor = Chomper;

Chomper.prototype.update = function() {
    //Check if offscreen and destroy
    if (this.x < -this.width){
        this.destroy()
        return;
    }
    // play chomper animation
    this.animations.play('chomp');

    // flash if invincible (after a hit)
    this.flash(this);

    // Calculate distance to target
    var distance = this.game.math.distance(this.x, this.y, this.target.x, this.target.y);

    // Calculate the angle to the target
    var rotation = this.game.math.angleBetween(this.x, this.y, this.target.x, this.target.y);

    // If the distance > MIN_DISTANCE then move
        //If player is using whirlpool then move towards them
    if (distance > this.MIN_DISTANCE) {
        this.body.velocity.setTo((Math.cos(rotation) * this.MAX_SPEED), Math.sin(rotation) * this.MAX_SPEED);
    } else if (distance > this.MIN_DISTANCE) {
        // Calculate velocity vector based on rotation and this.MAX_SPEED
        this.body.velocity.x = Math.cos(rotation) * this.MAX_SPEED;
        this.body.velocity.y = Math.sin(rotation) * this.MAX_SPEED;
    } else {
        this.body.velocity.setTo(0, 0);
    }
};

Chomper.prototype.takeDamage = alexTown.takeDamage;

Chomper.prototype.flash = alexTown.flash;
