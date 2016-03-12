var Charger = function(game, x, y, target) {
    Enemy.call(this, game, x, y, target, 'charger');

    //add animations (not included in enemyBase.js)
    this.animations.add('charge', [0,1,2,3], 10, true);
    this.animations.add('stunned', [4,5], 10, true);

    //override health
    this.health = 2;

    // set up sight vars    
    this.MIN_DISTANCE = 4; // pixels
    this.noticeTarget = 500;

    // movement var
    this.CHARGE_SPEED = 200;
};

// Chargers are a type of Enemy
Charger.prototype = Object.create(Enemy.prototype);
Charger.prototype.constructor = Charger;

// extends base state
Charger.prototype.enemyDefaultState = (function(_super) {
    return function() {
        /* add extension logic here */
        this.animations.play('charge');
        //transition to charge state if player is near
        if (this.getDistToPlayer() < this.noticeTarget && this.x > this.target.x) {
           this.currentState = this.enemyChargeState;
        }

        return _super.apply(this, arguments);
    };
})(Enemy.prototype.enemyDefaultState);

// overrides base state
Charger.prototype.enemyStunnedState = function() {
    this.animations.play('stunned');
}

// charge state specific to charger
Charger.prototype.enemyChargeState = function() {
    // play animation
    this.animations.play('charge');
    // Move
    this.body.velocity.setTo(-this.CHARGE_SPEED, 0);

    // stop charging if past player
    if (this.getDistToPlayer() > this.noticeTarget || this.x < this.target.x) {
        this.currentState = this.enemyDefaultState;
    }

    // Later, I think i'd like to do more of a special move where
    // the charger stomps the ground for a second, and then charges
    // straight towards the player and then has a cooldown where he
    // maybe walks slow for a second.  So it gives the player a 
    // minute to avoid the charge, and then hit them during the 
    // cooldown.  We could increase the health of the charger
    // so that it's more about timing, hit them during the cool-
    // down, you know?
};


