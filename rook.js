var Rook = function(game, x, y, target, ammo) {
    Phaser.Sprite.call(this, game, x, y, 'rook');

    // Save the target that this Follower will follow
    // The target is any object with x and y properties
    this.target = target;

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
    this.ammo = ammo;

};

// Followers are a type of Phaser.Sprite
Rook.prototype = Object.create(Phaser.Sprite.prototype);
Rook.prototype.constructor = Rook;

Rook.prototype.update = function() {
    // play rook animation
    this.animations.play('hop');


    // Calculate distance to target
    var distance = this.game.math.distance(this.x, this.y, this.target.x, this.target.y);
    // Calculate the angle to the target
    var rotation = this.game.math.angleBetween(this.x, this.y, this.target.x, this.target.y);
    // If the distance > MIN_DISTANCE then move
    if (distance > this.MIN_DISTANCE) {
        // Calculate velocity vector based on rotation and this.MAX_SPEED
        this.body.velocity.x = Math.cos(rotation) * this.MAX_SPEED;
        this.body.velocity.y = Math.sin(rotation) * this.MAX_SPEED;
        // otherwise shoot arrow
    } else {
        this.body.velocity.setTo(0, 0);
    }
    if (this.reload_count >= this.reload_stat) {
        var arrow = this.ammo.getFirstDead();
        if (arrow === null || arrow === undefined) return;
        arrow.revive();
        arrow.checkWorldBounds = true;
        arrow.outOfBoundsKill = true;
        arrow.reset(this.x, this.y);
        arrow.body.velocity.x = Math.cos(rotation) * arrow.SPEED;
        arrow.body.velocity.y = Math.sin(rotation) * arrow.SPEED;
        this.reload_count = 0;
    } else {
        this.reload_count++;
    }
};

// arrow class definition
var Arrow = function(game, x, y) {
    Phaser.Sprite.call(this, game, x, y, 'arrow');
    this.game.physics.enable(this, Phaser.Physics.ARCADE);
    this.SPEED = 300;
};

Arrow.prototype = Object.create(Phaser.Sprite.prototype);
Arrow.prototype.constructor = Arrow;