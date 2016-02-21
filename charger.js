var Charger = function(game, x, y) {
    Phaser.Sprite.call(this, game, x, y, 'zombie');

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
    // play zombie animation
    this.animations.play('chomp');

    // If the distance > MIN_DISTANCE then move
    this.body.velocity.setTo(-100, 0);
};
