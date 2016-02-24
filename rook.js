var Rook = function(game, x, y, target, ammo) {
    Phaser.Sprite.call(this, game, x, y, 'rook');

    this.animations.add('hop', [0,1,2,3], 10, true);
    this.smoothed = false;

    // Save the target that this Follower will follow
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
    this.MIN_DISTANCE = 300; // pixels

    // Weapon
    this.reload_stat = 50;
    this.reload_count = 50;
    this.quiver = 6;
    this.ammo = ammo;

    //this.checkWorldBounds = true;
    //this.events.onOutOfBounds.add( function(obj){ obj.destroy(); }, this );

};

// Followers are a type of Phaser.Sprite
Rook.prototype = Object.create(Phaser.Sprite.prototype);
Rook.prototype.constructor = Rook;

Rook.prototype.update = function() {
    //Check if offscreen and destroy
    if (this.x < -this.width){
        this.destroy()
        return;
    }

    // play rook animation
    this.animations.play('hop');

    // flash if invincible (after a hit)
    this.flash();

    // Calculate distance to target
    var distance = this.game.math.distance(this.x, this.y, this.target.x, this.target.y);
    // Calculate the angle to the target
    var rotation = this.game.math.angleBetween(this.x, this.y, this.target.x, this.target.y);
    // If the distance > MIN_DISTANCE then move
    if (distance > this.MIN_DISTANCE || this.quiver <= 0) {
        // Calculate velocity vector based on rotation and this.MAX_SPEED
        this.body.velocity.x = -this.MAX_SPEED;
        // otherwise shoot arrow
    } else {
        this.body.velocity.setTo(0, 0);
    }
    if (this.reload_count >= this.reload_stat && this.quiver > 0) {
        var arrow = this.ammo.getFirstDead();
        if (arrow === null || arrow === undefined) return;
        arrow.revive();
        arrow.checkWorldBounds = true;
        arrow.outOfBoundsKill = true;
        arrow.reset(this.x, this.y);
        arrow.body.velocity.x = Math.cos(rotation) * arrow.SPEED;
        arrow.body.velocity.y = Math.sin(rotation) * arrow.SPEED;
        this.reload_count = 0;
        this.quiver--
    } else {
        this.reload_count++;
    }
};

Rook.prototype.takeDamage = function(damage) {
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

Rook.prototype.flash = function() {
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

// arrow class definition
var Arrow = function(game, x, y) {
    Phaser.Sprite.call(this, game, x, y, 'arrow');
    this.game.physics.enable(this, Phaser.Physics.ARCADE);
    this.SPEED = 300;
    this.kill();

};

Arrow.prototype = Object.create(Phaser.Sprite.prototype);
Arrow.prototype.constructor = Arrow;
