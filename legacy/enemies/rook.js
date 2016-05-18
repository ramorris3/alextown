var Rook = function(game, x, y, target, ammo) {
    Enemy.call(this, game, x, y, target, 'rook');

    this.animations.add('hop', [0,1,2,3], 10, true);
    this.animations.add('stunned', [4,5], 10, true);

    //override health
    this.health = 4;

    // Define constants that affect motion
    this.MIN_DISTANCE = 300; // pixels

    // Weapon
    this.reloadStat = 50;
    this.reloadCount = 50;
    this.quiver = 6;
    this.ammo = ammo;

    this.xpValue = 10;
};

// Rooks are a type of Phaser.Sprite
Rook.prototype = Object.create(Enemy.prototype);
Rook.prototype.constructor = Rook;

// overwrite base state
Rook.prototype.enemyDefaultState = function() {
    this.animations.play('hop');
    // if too close or if out of arrows, then move
    var distance = this.getDistToPlayer();
    if (distance > this.MIN_DISTANCE || this.quiver <= 0) {
        this.body.velocity.setTo(-this.MAX_SPEED, 0);
    } else {
        this.body.velocity.setTo(0, 0);
    }
    // if there are arrows left and it's reloaded, shoot
    if (this.reloadCount >= this.reloadStat && this.quiver > 0) {
        var arrow = this.ammo.getFirstDead();
        if (arrow === null || arrow === undefined) return;
        arrow.fire(this);
        //modify rook stats accordingly
        this.reloadCount = 0;
        this.quiver--;
    } else {
        this.reloadCount++;
    }
};

// overrides base state
Rook.prototype.enemyStunnedState = function() {
    this.animations.play('stunned');
};