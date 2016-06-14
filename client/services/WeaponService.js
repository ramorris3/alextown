app.service('WeaponService',
  ['$http', 'LoaderService', 'MessageService',
  function($http, LoaderService, MessageService)
  {
    var self = this;
    var allWeapons = {};
    self.getAllWeapons = function() {
      return allWeapons;
    };
    self.getWeapon = function(key) {
      return allWeapons[key];
    };

    init();

    self.saveWeapon = function(weaponData) {
      // check for existing weapons
      if (allWeapons.hasOwnProperty(weaponData.name)) {
        var overwrite = confirm('There is already a weapon called "' + weaponData.name + '." Do you want to overwrite this weapon?');
        if (!overwrite) {
          MessageService.setFlashMessage('Weapon was not saved.', true);
          return;
        }
      }

      // save the weapon
      $http.post('..api/save/weapons', weaponData)
        .success(function(data) {
          MessageService.setFlashMessage(data.message, false);
          // reload weapons
          allWeapons = data.allWeaponData;
        })
        .error(function(data) {
          MessageService.setFlashMessage(data.message, true);
        });
    };

    var Bullet = function (game, key) {

        Phaser.Sprite.call(this, game, 0, 0, key);

        this.texture.baseTexture.scaleMode = PIXI.scaleModes.NEAREST;

        this.anchor.set(0.5);

        this.checkWorldBounds = true;
        this.outOfBoundsKill = true;
        this.exists = false;

        this.tracking = false;
        this.scaleSpeed = 0;

    };

    Bullet.prototype = Object.create(Phaser.Sprite.prototype);
    Bullet.prototype.constructor = self.Bullet;

    Bullet.prototoype.fire = function(x, y, angle, speed, gx, gy) {

      gx = gx || 0;
      gy = gy || 0;

      this.reset(x, y);
      this.sale.set(1);

      this.game.physics.arcade.velocityFromAngle(angle, speed, this.body.velocity);

      this.angle = angle;
      this.body.gravity.set(gx, gy);
    };

    Bullet.prototype.update = function() {
      if (this.tracking) {
        this.rotation = Math.atan2(this.body.velocity.y, this.body.velocity.x);
      }

      if (this.scaleSpeed > 0)
      {
        this.scale.x += this.scaleSpeed;
        this.scale.y += this.scaleSpeed;
      }
    };

    self.firePatterns = {};

    ////////////////////////////////////////////////////
    //  A single bullet is fired in front of the ship //
    ////////////////////////////////////////////////////

    self.firePatterns.singleBullet = function(game, player, weaponData) {
      return {
        create: function() {
          game.bullets = game.add.group();
          this.nextFire = 0;
          this.bulletSpeed = 600;
          this.fireRate = weaponData.fireRate;

          for (var i = 0; i < 64; i++)
          {
            game.bullets.add(new Bullet(game, weaponData.spritesheet.key))
          }
        },
        fire: function(source) {
          if (this.game.time.time < this.nextFire) { return; }
          var x = source.x + 10;
          var y = source.y + 10;

          game.bullets.getFirstExists(false).fire(x, y, 0, this.bulletSpeed, 0, 0);

          this.nextFire = this.game.time.time + this.fireRate;
        }
      }
    };



    // // weapon game object
    // self.Weapon = function(game, playerSprite, weaponData) {
    //   return {
    //     create: function() {
    //       // init vars
    //       // cooldown
    //       // damage
    //       // etc.
    //     },
    //     fire: function() {
    //       weaponData.
    //     }
    //   }
    // };

    // self.getFirePatterns = function() {
    //   return {
    //     normal: function(bulletGroup) {

    //     },
    //     fan: function(bulletGroup) {

    //     },
    //     radius: function(bulletGroup) {

    //     },
    //     scatter: function(bulletGroup) {

    //     },
    //     beam: function(bulletGroup) {

    //     },
    //     wave: function(bulletGroup) {

    //     },
    //     scale: function(bulletGroup) {

    //     }
    //   }
    // };

    function init() {
      $http.get('/api/weapons')
        .success(function(data) {
          allWeapons = data.allWeaponData;
          LoaderService.weapon = true;
          LoaderService.loadHandler();
        })
        .error(function(data) {
          MessageService.setFlashMessage(data.message, true);
        });
    };

  }
]);