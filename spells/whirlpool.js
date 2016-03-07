var magicWhirlpool = function(game) {
    this.game = game;
    //Call a null sprite that is used for getting position
    Phaser.Sprite.call(this, game, 0, 0, '');

    //Cooldown 
    this.nextAttack = 0;
    this.coolDown = 8000;
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
    var pool = game.add.sprite(posx - 50, posy - 50, 'whirlpool');
    var movepool = pool.animations.add('spin');

    //Questionable decisions :S
    for (i = 0; i < 3; i++) {
        //Have to do this enough times to get the whirlpool beneath the enemies... I can't even.
        game.world.moveDown(pool);    
    }
    //add loop to hold enemies
    game.time.events.loop(1, animateWhirlpool, this, this.game, this, posx, posy, this.game.time.time, pool);
};

function animateWhirlpool(game, enemy, posx, posy, startTime, pool) {
        //Makes loop last 5 seconds
        if (game.time.time >= startTime + 5000) {
            pool.kill();
            game.time.events.remove(this);
            return;
        }
        pool.animations.play('spin', 4, true);

        // Holds enemies in place
        this.game.enemygroup.forEachExists(MoveEnemy, enemy, posx, posy, this);
}

//Runs for each enemy
var MoveEnemy = function(enemy, posx, posy) {
    var distance = this.game.math.distance(enemy.x, enemy.y, posx, posy);
    //If within distance hold enemy
    if (distance < 150) {
        var rotation = this.game.math.angleBetween(enemy.x, enemy.y, posx + 25, posy + 25);
        const SPEED = 150;

        enemy.body.velocity.x = Math.cos(rotation) * SPEED;
        enemy.body.velocity.y = Math.sin(rotation) * SPEED;    
    }
};