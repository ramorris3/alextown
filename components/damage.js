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

alexTown.updateXP = function(data) {
    data.game.playerXP += data.xpValue;
    if (data.game.playerXP >= data.game.nextLevel) {
        game.playerLevel += 1;
        data.game.nextLevel = ~~((game.playerLevel * (game.playerLevel + 1)) / 2) * 100;
        data.game.xpMeter.flashTimer = 30;
    }
    var meterText = 'EXP ' + data.game.playerXP + '/' + data.game.nextLevel;
    data.game.xpMeter.x = data.game.width - 20 * meterText.length - 50;
    data.game.xpMeter.text = meterText;
}