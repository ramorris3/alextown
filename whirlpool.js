var magicWhirlpool = function(game) {
    this.game = game;
    //Phaser.Sprite.call(this, game, )
    Phaser.Sprite.call(this, game, 33, -20, 'warriorsword');
    game.physics.enable(this, Phaser.Physics.ARCADE);
    this.animations.add('swing', [0,1,2,3,4,5,6,7,8,9], 30, false);
    this.smoothed = false;

    this.nextAttack = 0;
    this.coolDown = 5000;

    this.kill();
};

magicWhirlpool.prototype = Object.create(Phaser.Sprite.prototype);
magicWhirlpool.prototype.constructor = magicWhirlpool;

magicWhirlpool.prototype.cast = function(game, target) {
    this.game = game;
    if (this.game.time.time < this.coolDown) {
        return;
    }

    this.revive();
    this.animations.play('swing', 30, false, true);
    //Animation for whirlpool

    this.game.enemygroup.forEachExists(MoveEnemy, this, target);
    // Cooldown
    this.nextAttack = this.game.time.time + this.coolDown;
};

var MoveEnemy = function(enemy, target) {
    var rotation = this.game.math.angleBetween(enemy.x, enemy.y, target.x, target.y);
    const SPEED = 300;
    //tank.body.reset( game.world.centerX + (scale*tank_state.position.x), game.world.centerY + (scale*tank_state.position.y));
    //enemy.body.velocity.reset(enemy.body.velocity.x, enemy.body.velocity.y);

    enemy.body.velocity.x = Math.cos(rotation) * SPEED;
    enemy.body.velocity.y = Math.sin(rotation) * SPEED;
};