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
    this.flash();

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

Chomper.prototype.takeDamage = function(damage) {
    if (!this.invincible) {
        // only damage if not invincible
        this.health -= damage;

        if (this.health <= 0) {
            // spawn a "dying corpse" sprite here before destroy
            this.destroy();
        }

        //toggle invincibility
        this.invincible = true;
        // set timer to restore to vulerable state afterwards
        var that = this;
        game.time.events.add(200, function() { 
            that.invincible = false;
        }, this);
    }
};

Chomper.prototype.flash = function() {
    if (this.invincible) {
        this.flashTimer++;
        // if invincible, flash every 2 frames
        if (!(this.flashTimer % 2)) {
            this.tint = 0xFB0000;
        } else {
            this.tint = 0xffffff;
        }
    } else { // not hurt/invincible, reset tint to default
        this.tint = 0xffffff;
    }
};

