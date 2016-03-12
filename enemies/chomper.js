var Chomper = function(game, x, y, target) {
    Enemy.call(this, game, x, y, target, 'chomper');

    this.animations.add('chomp', [0,1,2,3], 10, true);
    this.animations.add('stunned', [4,5], 10, true);

    //override health
    this.health = 2;

    // Define constants that affect motion
    this.MIN_DISTANCE = 4; // pixels

    //player slow effect
    this.slowSpeed = 10;
};

// Chompers are a type of Phaser.Sprite
Chomper.prototype = Object.create(Enemy.prototype);
Chomper.prototype.constructor = Chomper;

// overwrite base state (not extend)
Chomper.prototype.enemyDefaultState = function() {
    this.animations.play('chomp');
    // get distance to player, and if in sight, pursue
    var distance = this.getDistToPlayer();
    if (distance > this.MIN_DISTANCE) {
        this.pursueTarget(this.MAX_SPEED);
    } else {
        this.body.velocity.setTo(-50, 0); // move towards left
    }
};

// overrides base state
Chomper.prototype.enemyStunnedState = function() {
    this.animations.play('stunned');
};

// overwrite damage player so that chomper slows player, and doesn't deal damage
Chomper.prototype.damagePlayer = function(player) {
    //make player flash blue and then make them slower
    if (player.body.velocity.x >= this.slowSpeed) {
        player.body.velocity.x = this.slowSpeed;
    }    
    if (player.body.velocity.y >= this.slowSpeed) {
        player.body.velocity.y = this.slowSpeed;
    }
};
