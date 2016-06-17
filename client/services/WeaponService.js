app.service('WeaponService',
  ['$http', 'LoaderService', 'MessageService',
  function($http, LoaderService, MessageService)
  {
    var self = this;
    var allWeaponData; // 3D heirarchical, as stored in the database
    var allWeapons = {}; // 1D mapped by name
    self.getAllWeapons = function() {
      return allWeapons;
    };
    self.getWeapon = function(key) {
      return allWeapons[key];
    };

    self.getRarities = function() {
      return [
        'Common',
        'Rare',
        'Legendary'
      ];
    };

    init();

    self.saveWeapon = function(weaponData) {
      // check for existing weapons
      var weaponGroup;
      try {
        weaponGroup = allWeaponData[weaponData.class][weaponData.level][weaponData.rarity];
        if (weaponGroup.hasOwnProperty(weaponData.name)) {
          var overwrite = confirm('There is already a LV ' + weaponData.level + ' ' + weaponData.class + ' weapon called "' + weaponData.name + '." Do you want to overwrite this weapon?');
          if (!overwrite) {
            MessageService.setFlashMessage('Weapon was not saved.', true);
            return;
          }
        }
      } catch (err) {
        // weapon not found
        console.log(err);
      }

      // save the weapon
      $http.post('../api/save/weapons', weaponData)
        .success(function(data) {
          MessageService.setFlashMessage(data.message, false);
          // reload weapons
          allWeaponData = data.allWeaponData;
          allWeapons = formatWeapons(allWeaponData);
        })
        .error(function(data) {
          MessageService.setFlashMessage(data.message, true);
        });
    };

    // get loot
    self.getLoot = function(playerLevel, playerClass) {
      var loot = [];
      var rngesus;
      var rarity;
      var level;
      var safety = 0;
      while(loot.length < 5) {
        // to avoid infinite loop (if there are no weapons in database)
        if (safety++ >= 100) {
          return [];
        }
        // choose the rarity for this weapon
        rngesus = Math.random();
        rarity = 'Common';
        if (rngesus <= 0.10) {
          rarity = 'Legendary';
        } else if (rngesus <= 0.5) {
          rarity = 'Rare';
        }

        // choose the level
        var levelOffset = Math.floor(Math.random() * 3);
        var upOrDown = Math.random() > 0.5 ? -1 : 1;
        level = playerLevel + (levelOffset * upOrDown);
        if (level < 1) level = 1;
        if (level > 30) level = 30;

        // get random weapon of given level and rarity
        var weapon;
        var weaponGroup;
        var levelGroup = allWeaponData[playerClass][level];
        if (levelGroup) {
          weaponGroup = levelGroup[rarity];
        }
        if (weaponGroup) {
          // get random weapon
          var keys = Object.keys(weaponGroup);
          weapon = weaponGroup[keys[ keys.length * Math.random() << 0]];
          // add to loot
          loot.push(weapon);
        }
      }

      return loot;
    };


    ///////////////////////
    // BULLET BASE CLASS //
    ///////////////////////

    var Bullet = function (game, key) {

        Phaser.Sprite.call(this, game, 0, 0, key);
        this.animations.add('fly');

        this.texture.baseTexture.scaleMode = PIXI.scaleModes.NEAREST;

        this.anchor.set(0.5);

        game.physics.enable(this, Phaser.Physics.ARCADE);

        this.checkWorldBounds = true;
        this.outOfBoundsKill = true;
        this.exists = false;

        this.tracking = false;
        this.scaleSpeed = 0;

    };

    Bullet.prototype = Object.create(Phaser.Sprite.prototype);
    Bullet.prototype.constructor = self.Bullet;

    Bullet.prototype.fire = function(x, y, angle, speed, gx, gy) {

      gx = gx || 0;
      gy = gy || 0;

      this.reset(x, y);
      this.scale.set(1);

      this.game.physics.arcade.velocityFromAngle(angle, speed, this.body.velocity);

      this.angle = angle;
      this.body.gravity.set(gx, gy);

      this.animations.play('fly', 10, true);
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

    var firePatterns = {};

    ////////////////////////////////////////////////////
    //  A single bullet is fired in front of the ship //
    ////////////////////////////////////////////////////

    firePatterns.SingleBullet = {
      create: function(game, weaponData, damage) {
        game.allPlayerBullets = game.add.group();
        this.nextFire = 0;
        this.bulletSpeed = 600;
        this.fireRate = 200;

        for (var i = 0; i < 64; i++)
        {
          var bullet = game.allPlayerBullets.add(new Bullet(game, weaponData.spritesheet.key));
          bullet.damage = damage;
        }
      },
      fire: function(game, source) {
        if (game.time.time < this.nextFire) { return; }
        var x = source.x + 10;
        var y = source.y + 10;

        game.allPlayerBullets.getFirstExists(false).fire(x, y, 0, this.bulletSpeed, 0, 0);

        this.nextFire = game.time.time + this.fireRate;
      }
    };

    /////////////////////////////////////////////////////////
    //  Radius shot, 8 bullets in a circle from the player //
    /////////////////////////////////////////////////////////

    firePatterns.Radius = {
      create: function(game, weaponData, damage) {
        game.allPlayerBullets = game.add.group();
        this.nextFire = 0;
        this.bulletSpeed = 600;
        this.fireRate = 200;

        for (var i = 0; i < 96; i++)
        {
          var bullet = game.allPlayerBullets.add(new Bullet(game, weaponData.spritesheet.key));
          bullet.damage = damage;
        }
      },
      fire: function(game, source) {
        if (game.time.time < this.nextFire) { return; }

        var x = source.x + 10;
        var y = source.y + 10;

        // create 8 bullets
        for (var i = 0; i < 8; i++) {
          game.allPlayerBullets.getFirstExists(false).fire(x, y, i*45, this.bulletSpeed, 0, 0);
        }

        this.nextFire = game.time.time + this.fireRate;
      }
    };

    self.getFirePatterns = function() {
      return firePatterns;
    };
    self.getFirePattern = function(key) {
      return firePatterns[key];
    };

    function init() {
      $http.get('/api/weapons')
        .success(function(data) {
          allWeaponData = data.allWeaponData;
          allWeapons = formatWeapons(allWeaponData);
          LoaderService.weapon = true;
          LoaderService.loadHandler();
        })
        .error(function(data) {
          MessageService.setFlashMessage(data.message, true);
        });
    }

    function formatWeapons(allWeaponData) {
      var weapons = {};
      for (var playerClass in allWeaponData) {
        if (allWeaponData.hasOwnProperty(playerClass)) {
          var levelGroup = allWeaponData[playerClass];
          for (var level in levelGroup) {
            if (levelGroup.hasOwnProperty(level)) {
              var rarityGroup = levelGroup[level];
              for (var rarity in rarityGroup) {
                if (rarityGroup.hasOwnProperty(rarity)) {
                  var weaponGroup = rarityGroup[rarity];
                  for (var weapon in weaponGroup) {
                    if (weaponGroup.hasOwnProperty(weapon)) {
                      weapons[weapon] = weaponGroup[weapon];
                    }
                  }
                }
              }
            }
          }
        }
      }
      return weapons;
    }
  }
]);