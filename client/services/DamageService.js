app.service('DamageService', function() {
  var self = this;
  
  // damage function for sprite and 
  self.takeDamage = function(sprite, damage, isPlayer) {
    // only damage if not invincible
    if (sprite.invincible) {
      return;
    }
    sprite.health -= damage;
    if (sprite.health <= 0) {
      var deathSpr = sprite.game.deathAnimations.getFirstDead();
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
        var game = sprite.game;
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
      sprite.game.time.events.add(50, function() {
        sprite.invincible = false;
      }, sprite);
    }

    sprite.flashing = true;
    // set time to restore to 'not flashing'
    sprite.game.time.events.add(500, function() {
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