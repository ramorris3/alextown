var Rook = function(game, x, y, target, ammo) {
    Phaser.Sprite.call(this, game, x, y, 'rook');

    this.animations.add('hop', [0,1,2,3], 10, true);
    this.smoothed = false;

    //set up damage logic
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

    // Target
    this.target = target;

    // Weapon
    this.reload_stat = 50;
    this.reload_count = 50;
    this.quiver = 6;
    this.ammo = ammo;
};

// Rooks are a type of Phaser.Sprite
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
    this.flash(this);

    // Calculate distance to target
    var distance = this.game.math.distance(this.x, this.y, this.target.x, this.target.y);

    // If the distance > MIN_DISTANCE or is out of arrows then move
    if (distance > this.MIN_DISTANCE || this.quiver <= 0) {
        this.body.velocity.x = -this.MAX_SPEED;
    } else {
        this.body.velocity.setTo(0, 0);
    }
    // If there are arrows left in quiver and is reloaded, shoot
    if (this.reload_count >= this.reload_stat && this.quiver > 0) {
        var arrow = this.ammo.getFirstDead();
        if (arrow === null || arrow === undefined) return;
        arrow.fire(this);
        //modify rook stats accordingly
        this.reload_count = 0;
        this.quiver--;
    } else {
        this.reload_count++;
    }
};

Rook.prototype.takeDamage = alexTown.takeDamage;

Rook.prototype.flash = alexTown.flash;