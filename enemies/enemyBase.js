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
};

Enemy.prototype = Object.create(Phaser.Sprite.prototype);
Enemy.prototype.constructor = Enemy;

Enemy.prototype.update = function() {
    //Check if offscreen and destroy
    if (this.x < -this.width){
        this.destroy();
        return;
    }
    //run current state logic
    this.currentState();
    // flash if invincible (after a hit)
    this.flash(this);
};

/* ALL OF THE STATE FUNCTIONS **MUST** BE OVERRIDDEN BY CHILDREN */
// (you shouldn't have to change the update function)
Enemy.prototype.enemyDefaultState = function() {
	//override to play walking animation, make custom movement
    this.body.velocity.setTo(-this.MAX_SPEED, 0);
};

Enemy.prototype.enemyStunnedState = function() {
    //override to playstunned animation 
    this.body.velocity.setTo(0, 0);
};
/* END STATE LOGIC */

/* OTHER ENEMY FUNCTIONS */
Enemy.prototype.takeDamage = alexTown.takeDamage;

Enemy.prototype.stun = function() {
    this.currentState = this.enemyStunnedState;
};

Enemy.prototype.unStun = function() {
    this.currentState = this.enemyDefaultState;
};

Enemy.prototype.flash = alexTown.flash;

Enemy.prototype.getDistToPlayer = function() {
    return this.game.math.distance(this.x, this.y, this.target.x, this.target.y);
};

Enemy.prototype.pursuePlayer = function(speed) {
    // Calculate the angle to the target
    var rotation = this.game.math.angleBetween(this.x, this.y, this.target.x, this.target.y);

    this.body.velocity.setTo(
        Math.cos(rotation) * speed,
        Math.sin(rotation) * speed
    );
};
