var magicWhirlpool = function(game) {
    this.game = game;
    //Call a null sprite that is used for getting position
    Phaser.Sprite.call(this, game, 0, 0, '');

    //Cooldown 
    this.nextAttack = 0;
    this.coolDown = 5000;
    var endtime;

    this.kill();
};

magicWhirlpool.prototype = Object.create(Phaser.Sprite.prototype);
magicWhirlpool.prototype.constructor = magicWhirlpool;

magicWhirlpool.prototype.cast = function(game, target) {
    this.game = game;
    if (this.game.time.time < this.nextAttack) {
        return;
    }
        //Position constants 
    const posx = target.x;
    const posy = target.y;
    // Cooldown
    this.nextAttack = this.game.time.time + this.coolDown;
    //Animation for whirlpool ++Needs to be updated to a whirlpool
    var pool = game.add.sprite(posx, posy, 'warriorsword');
    var movepool = pool.animations.add('swing', [0,1,2,3,4,5,6,7,8,9], 30, true);
    //add loop to hold enemies
    game.time.events.loop(1, animateWhirlpool, this, this.game, this, posx, posy, this.game.time.time, pool);
};

function animateWhirlpool(game, enemy, posx, posy, startTime, pool) {
        //Makes loop last 8 seconds
        if (game.time.time >= startTime + 5000) {
            pool.kill();
            game.time.events.remove(this);
            return;
        }
        pool.animations.play('swing', 30, true);

        // Holds enemies in place
        this.game.enemygroup.forEachExists(MoveEnemy, enemy, posx, posy, this);
}

//Runs for each enemy
var MoveEnemy = function(enemy, posx, posy) {
    var distance = this.game.math.distance(enemy.x, enemy.y, posx, posy);
    //If within distance hold enemy
    if (distance < 150) {
        var rotation = this.game.math.angleBetween(enemy.x, enemy.y, posx, posy);
        const SPEED = 300;

        enemy.body.velocity.x = Math.cos(rotation) * SPEED;
        enemy.body.velocity.y = Math.sin(rotation) * SPEED;    
    }
};