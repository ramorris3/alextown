app.service('DamageService', function() {
  var self = this;
  
  // damage function for sprite and 
  self.takeDamage = function(sprite, damage, isPlayer) {
    var game = sprite.game;

    // only damage if not invincible
    if (sprite.invincible) {
      return;
    }

    var crit = Math.random() <= 0.2; // 20% crit chance (test)
    if (crit) damage += (damage * 5);
    sprite.health -= damage;

    // show damage numbers
    if (game.damageNums) {
      var dmgText = game.damageNums.getFirstDead();
      if (dmgText) {
        dmgText.revive();
        dmgText.text = damage;
        dmgText.outOfBoundsKill = true;
        dmgText.reset(sprite.x, sprite.y);
        dmgText.alpha = 1;
        dmgText.grav = -0.1;
        dmgText.ydx = 3.5;
        dmgText.xdx = Math.random() * 1.5;
        dmgText.tint = 0xffffff;
        if (crit) {
          dmgText.text = damage + ' CRIT!';
          dmgText.ydx = 3.8;
          dmgText.tint = 0x860000;
        }
        if (Math.random() >= 0.5) dmgText.xdx *= -1;
        dmgText.update = function() {
          dmgText.x = dmgText.x + dmgText.xdx;
          dmgText.y -= dmgText.ydx;
          dmgText.ydx += dmgText.grav;
          dmgText.alpha -= 0.02;
          if (dmgText.alpha <= 0) {
            dmgText.kill();
          }
        };
      }
    }


    if (sprite.health <= 0) {
      var deathSpr = game.deathAnimations.getFirstDead();
      if (deathSpr) {
        deathSpr.revive();
        deathSpr.checkWorldBounds = true;
        deathSpr.outOfBoundsKill = true;
        deathSpr.reset(sprite.x, sprite.y);
        deathSpr.body.velocity.x = -50;
        deathSpr.animations.play('die', 10, false, true);
      }
      sprite.pendingDestroy = true;
      if (isPlayer) {
        // player death
        var fadeout = game.add.tween(game.world).to({ alpha: 0 }, 2000, "Linear", true, 0);
        fadeout.onComplete.add(function() {
          game.state.start('lose');
        });
      }
    }

    // toggle invincibility if player
    if (isPlayer) {
      sprite.invincible = true;
      // set time to restore to vulnerable after
      game.time.events.add(350, function() {
        sprite.invincible = false;
      }, sprite);
    }

    sprite.flashing = true;
    // set time to restore to 'not flashing'
    game.time.events.add(500, function() {
      sprite.flashing = false;
    }, sprite);
  };

  self.flash = function(sprite) {
    if (sprite.flashing) {
      sprite.flashTimer++;
      // if invincible, flash every 2 frames
      if (sprite.flashTimer % 4 === 0) {
          sprite.tint = 0x860000;
      } else {
          sprite.tint = 0xffffff;
      }
    } else { // not hurt/invincible, reset tint to default
      sprite.tint = 0xffffff;
    }
  };

});