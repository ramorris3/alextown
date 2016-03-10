var Arrow = function(game, x, y) {
    Phaser.Sprite.call(this, game, x, y, 'arrow');
    this.game.physics.enable(this, Phaser.Physics.ARCADE);
    this.SPEED = 500;
    this.checkWorldBounds = true;
    this.outOfBoundsKill = true;
    this.kill();
    this.attackPoints = 1;
};

Arrow.prototype = Object.create(Phaser.Sprite.prototype);
Arrow.prototype.constructor = Arrow;

// revives arrow and shoots to the left
Arrow.prototype.fire = function(rook) {
    this.revive();
    this.reset(rook.x, rook.y);
    this.body.velocity.x = -this.SPEED; // moving left

};

Arrow.prototype.damageTarget = function(target) {
	target.takeDamage(target, this.attackPoints, target.flinch); 
};