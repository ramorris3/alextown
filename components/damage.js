alexTown.takeDamage = function(self, damage, flinch) {
    if (!self.invincible) {
        // only damage if not invincible
        self.damage(damage);

        // visual effects
        Visuals.slices.slice(self);

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
    var player = data.game.player;
    player.XP += data.xpValue;
    if (player.XP >= player.nextLevel) {
        player.level += 1;
        player.nextLevel = ~~((player.level * (player.level + 1)) / 2) * 100;

        player.maxHealth += 1;
        player.heal(1);
        player.sword.damage += 1;

        data.game.levelUpText = game.add.bitmapText(data.game.width/2, data.game.height/2, 'carrier_command', 'LEVEL UP!', 40);
        data.game.levelUpText.anchor.set(0.5);
        data.game.levelUpText.update = function() {
            this.alpha -= 0.05;
            this.fontSize += 3;
            if (this.alpha < 0.1) {
                this.kill();
            }
        }
    }
    data.game.xpUpText = game.add.bitmapText(player.x, player.y, 'carrier_command', '+' + data.xpValue, 10);
    data.game.xpUpText.update = function() {
        this.alpha -= 0.02;
        this.y -= 3;
        if (this.alpha < 0.1) {
            this.kill();
        }
    };

    var meterText = 'LVL' + player.level + ' EXP ' + player.XP + '/' + player.nextLevel;
    data.game.xpMeter.text = meterText;
};

alexTown.spawnDrop = function(deadEnemy){
    if (Math.random() < .10) {
    var drop = deadEnemy.game.add.existing(
        new HealthDrop(deadEnemy.game, deadEnemy.x, deadEnemy.y)
    );
    Drops.dropsGroup.add(drop)}
};

alexTown.doOnEnemyDeath = function(enemy){
    alexTown.updateXP(enemy);
    alexTown.spawnDrop(enemy);
};