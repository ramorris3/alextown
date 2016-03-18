var Enemy = function(game, x, y, target, spriteKey) {
    this.game = game;
    Phaser.Sprite.call(this, game, x, y, spriteKey);

    /*children need to add animations on their own*/
    //add default animation
    //add stunned animation

    this.smoothed = false;

    //set up damage logic
    this.invincible = false;
    this.flashTimer = 20;
    this.health = 1;
    this.maxHealth = 1;
    this.attackPoints = 1;

    //set pivot point for sprite to the center
    this.anchor.setTo(0.5, 0.5);

    //enable physics
    this.game.physics.enable(this, Phaser.Physics.ARCADE);
    this.body.bounce.setTo(10, 10);

    //set motion constants/vars
    this.MAX_SPEED = 100; //pixels/sec
    this.target = target;

    //init state logic
    this.currentState = this.enemyDefaultState;

    this.events.onKilled.add(alexTown.doOnEnemyDeath, this);
};

Enemy.prototype = Object.create(Phaser.Sprite.prototype);
Enemy.prototype.constructor = Enemy;

Enemy.prototype.update = function() {
    //Check if offscreen and destroy
    if (this.x < -this.width){
        this.destroy();
        return;
    }

    //put cap on speed (fix scandash-esque issues)
    if (this.body.velocity.x > this.MAX_SPEED) {
        this.body.velocity.x = this.MAX_SPEED;
    }
    if (this.body.velocity.y > this.MAX_SPEED) {
        this.body.velocity.y = this.MAX_SPEED;
    }

    //run current state logic
    this.currentState();
    // flash if invincible (after a hit)
    this.flash(this);
};

/* ALL OF THE STATE FUNCTIONS SHOULD BE OVERRIDDEN/EXTENDED BY CHILDREN */
// these are just placeholders so we don't get reference errors
// (you shouldn't have to change the update function)
Enemy.prototype.enemyDefaultState = function() {
    //override to play walking animation, make custom movement
    this.body.velocity.setTo(-this.MAX_SPEED, 0);
};

Enemy.prototype.enemyStunnedState = function() {
    //override to play stunned animation 
    console.error('Enemy does not override enemyStunnedState');
};
/* END STATE LOGIC */

/* OTHER ENEMY FUNCTIONS */
Enemy.prototype.stun = function() {
    // stop enemy movement
    this.body.velocity.setTo(0, 0);
    this.currentState = this.enemyStunnedState;
};

Enemy.prototype.unstun = function() {
    // reset enemy movement (will be updated in default state)
    this.body.velocity.setTo(0, 0);
    this.currentState = this.enemyDefaultState;
};

Enemy.prototype.getDistToPlayer = function() {
    return this.game.math.distance(this.x, this.y, this.target.x, this.target.y);
};

Enemy.prototype.pursueTarget = function(speed) {
    // Calculate the angle to the target
    var rotation = this.game.math.angleBetween(this.x, this.y, this.target.x, this.target.y);
    // set velocity vector based on rotation and speed
    this.body.velocity.setTo(
        Math.cos(rotation) * speed,
        Math.sin(rotation) * speed
    );
};

Enemy.prototype.damagePlayer = function(player) {
    player.takeDamage(player, this.attackPoints, 800); //800 ms flinch
};

Enemy.prototype.takeDamage = alexTown.takeDamage;

Enemy.prototype.flash = alexTown.flash;
