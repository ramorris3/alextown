var Arrow = function(game, x, y) {
    Phaser.Sprite.call(this, game, x, y, 'arrow');
    this.game.physics.enable(this, Phaser.Physics.ARCADE);
    this.SPEED = 500;
    this.checkWorldBounds = true;
    this.outOfBoundsKill = true;
    this.kill();
};

Arrow.prototype = Object.create(Phaser.Sprite.prototype);
Arrow.prototype.constructor = Arrow;

// revives arrow and shoots to the left
Arrow.prototype.fire = function(rook) {
    this.revive();
    this.reset(rook.x, rook.y);
    this.body.velocity.x = -this.SPEED; // moving left

};