app.service('BossService',
  ['DamageService', 'WeaponService',
  function(DamageService, WeaponService) {
    var self = this;

    // ALL BOSSES ARE HARD-CODED

    var bosses = {};
    self.getBosses = function() {
      return bosses;
    };

    self.preloadBossAssets = function(game) {
      game.load.spritesheet('mini-snake', '../assets/mini-snake.png', 80, 47);
      game.load.spritesheet('biscione', '../assets/biscione.png', 328, 320);
      console.log('game.loaded spritesheet for boss');
    };

    /////////////////////////////
    // BISCIONE - serpent boss //
    /////////////////////////////

    self.Biscione = function(game, x, y) {
      this.game = game;
      Phaser.Sprite.call(this, this.game, x, y, 'biscione');
      this.anchor.setTo(0.5, 0.5);
      
      // init animations
      this.animations.add('move');
      this.animations.play('move', 10, true);

      // add a shadow??

      // physics
      this.game.physics.enable(this, Phaser.Physics.ARCADE);
      this.ySpeed = 2;

      // damage logic flags
      this.invincible = false;
      this.flashing = false;
      this.flashTimer = 0;

      // stats
      this.health = 150;
      this.damage = 5;

      this.game.add.existing(this);
    };

    self.Biscione.prototype = Object.create(Phaser.Sprite.prototype);
    self.Biscione.prototype.constructor = self.Biscione;

    self.Biscione.prototype.update = function() {
      DamageService.flash(this);
      this.y += this.ySpeed;
      if (this.y >= this.game.height - (this.height / 2) || this.y <= this.height / 2) {
        this.ySpeed *= -1;
      }
    };
  }
]);