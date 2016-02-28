alexTown.takeDamage = function(self, damage, flinch) {
    if (!self.invincible) {
        // only damage if not invincible
        self.damage(damage);

        //toggle invincibility
        self.invincible = true;
        // set timer to restore to vulerable state afterwards
        var that = self;
        game.time.events.add(flinch, function() { 
            that.invincible = false;
        }, self);
    }
};

alexTown.flash = function(self) {
    if (self.invincible) {
        self.flashTimer++;
        // if invincible, flash every 2 frames
        if (!(self.flashTimer % 2)) {
            self.tint = 0xFB0000;
        } else {
            self.tint = 0xffffff;
        }
    } else { // not hurt/invincible, reset tint to default
        self.tint = 0xffffff;
    }
};