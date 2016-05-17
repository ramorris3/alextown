var HealthDrop = function(game, x, y) {
    Phaser.Sprite.call(this, game, x, y, 'flower');
    this.animations.add('flutter', [0,1,2,3], 10, true);
    this.game.physics.enable(this, Phaser.Physics.ARCADE);
    this.body.velocity.x = -100;
    this.checkWorldBounds = true;
    this.outOfBoundsKill = true;
    this.healPoints = 1;
};

HealthDrop.prototype = Object.create(Phaser.Sprite.prototype);
HealthDrop.prototype.constructor = HealthDrop;

HealthDrop.prototype.update = function() {
    this.animations.play('flutter');
};
