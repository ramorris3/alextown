var app = angular.module('GameApp', []);
app.service('AssetService',
  ['$http', 'LoaderService', 'MessageService',
  function($http, LoaderService, MessageService) {
    var self = this;
    var allAssets = {};
    self.getAllAssets = function() {
      return allAssets;
    };

    init();

    self.getBullets = function() {
      return allAssets.Bullets;
    };

    self.getEnemies = function() {
      return allAssets.Enemies;
    };

    self.getBackgrounds = function() {
      return allAssets.Backgrounds;
    };

    self.saveAsset = function(spriteData, imgSrc) {
      // check for dupes
      var assetType = allAssets[spriteData.type];
      if (assetType.hasOwnProperty(spriteData.name)) {
        if (!confirm('There is already an asset of type "' + spriteData.type + '" named "' + spriteData.name + '."  Do you want to overwrite it?')) {
          MessageService.setFlashMessage('Asset was not saved.', true);
          return;
        }
      }

      // save img and get key (filename)
      $http.post('../api/save/img', {img: imgSrc, name: spriteData.name})
        .success(function(data) {
          // update spriteData with img reference
          spriteData.key = data.key;
          spriteData.src = data.src;
          
          $http.post('../api/save/asset', spriteData)
            .success(function(data) {
              MessageService.setFlashMessage(data.message);
              allAssets = data.allAssetData;
            })
            .error(function(data) {
              MessageService.setFlashMessage(data.message, true);
            });
        })
        .error(function(data) {
          MessageService.setFlashMessage(data.message, true);
        });
    };

    self.preloadAllAssets = function(game) {
      for (var category in allAssets) {
        if (allAssets.hasOwnProperty(category)) {
          var assets = allAssets[category];
          for (var asset in assets) {
            if (assets.hasOwnProperty(asset)) {
              var obj = assets[asset];
              // load to the game
              game.load.spritesheet(obj.key, obj.src, obj.width, obj.height);
            }
          }
        }
      }
    };

    function init() {
      $http.get('../api/assets')
        .success(function(data) {
          allAssets = data.allAssetData;
          LoaderService.assets = true;
          LoaderService.loadHandler();
        })
        .error(function(data) {
          console.log('ERROR' + JSON.stringify(data));
        });
    }
  }
]);
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
      this.alive = true;
      
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
      this.health = 40;
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
/* 
  This service contains the enemy object definition,
  and handles loading and saving enemies from/to the database
*/
app.service('EnemyService', 
  ['$http', '$rootScope', 'DamageService', 'LoaderService', 'MessageService',
  function($http, $rootScope, DamageService, LoaderService, MessageService) {

    var self = this;

    var allEnemies = {};
    self.getAllEnemies = function() {
      return allEnemies;
    };
    self.getEnemy = function(key) {
      return allEnemies[key];
    };

    init();

    self.saveEnemy = function(enemyData, callback) {
      // check for existing enemies
      if (allEnemies.hasOwnProperty(enemyData.name)) {
        var overwrite = confirm('There is already an enemy named "' + enemyData.name + '."  Do you want to overwrite this enemy?');
        if (!overwrite) {
          MessageService.setFlashMessage('Enemy was not saved.', true);
          return;
        }
      }

      // save enemy
      $http.post('../api/save/enemies', enemyData)
        .success(function(data) {
          MessageService.setFlashMessage(data.message, false);
          // reload enemies
          allEnemies = data.allEnemyData;
          if (callback) {
            callback();
          }
        })
        .error(function(data) {
          MessageService.setFlashMessage(data.message, true);
        });
    };


    //////////////////////
    // ENEMY OBJECT DEF //
    //////////////////////

    /* CONSTRUCTOR/CREATE FUNCTION */
    self.Enemy = function(game, x, y, data, playerSprite) {
      this.game = game;
      this.data = data;

      // create sprite
      Phaser.Sprite.call(this, this.game, x, y, data.spritesheet.key);
      // init animations
      // parse frames string to array of integers
      var moveFrames = data.moveFrames.split(',');
      for (i = 0; i < moveFrames.length; i++) {
        moveFrames[i] = parseInt(moveFrames[i], 10);
      }
      var attackFrames = data.attackFrames.split(',');
      for (i = 0; i < attackFrames.length; i++) {
        attackFrames[i] = parseInt(attackFrames[i], 10);
      }
      this.animations.add('move', moveFrames, data.moveFps);
      this.animations.add('attack', attackFrames, data.attackFps);
      // shadow
      var shadow = this.game.add.sprite(0, 32, 'shadow');
      shadow.anchor.setTo(0.5, 0.5);
      this.game.layers.shadows.add(shadow);
      var enemy = this;
      shadow.update = function() {
        this.x = enemy.x;
        this.y = enemy.y + (enemy.height / 2);
        if (enemy.health <= 0) {
          this.pendingDestroy = true;
        }
      };

      // init target
      this.target = playerSprite;

      // init physics
      this.game.physics.enable(this, Phaser.Physics.ARCADE);
      this.anchor.setTo(0.5, 0.5);

      // stats
      this.health = data.health;
      this.damage = data.damage;
      this.moveSpeed = data.moveSpeed;

      // damage logic vars
      this.invincible = false;
      this.flashing = false;
      this.flashTimer = 0;

      // enemy behavior config
      this.movePattern = data.movePattern;
      this.attackPattern = data.attackPattern;
      if (this.attackPattern.key === 'Charge') {
        this.getAttackStateInfo = this.getChargeStateInfo;
      } else if (this.attackPattern.key === 'Ranged') {
        this.getAttackStateInfo = this.getRangedStateInfo;
      } else {
        throw new Error('Attack-pattern key not recognized.');
      }
      this.getAttackStateInfo().setup();

      // state config
      this.currentState = this.defaultState;

      // add to game
      this.game.add.existing(this);
    };

    self.Enemy.prototype = Object.create(Phaser.Sprite.prototype);
    self.Enemy.prototype.constructor = self.Enemy;

    /* UPDATE FUNCTION */
    self.Enemy.prototype.update = function() {

      // invincible/flashing?
      DamageService.flash(this);

      // execute active state
      this.currentState();

      // kill only if off screen to the left
      if (this.x < -this.width) {
        this.pendingDestroy = true;
      }
    };


    ///////////////////////////////////
    // ATTACK OPTION IMPLEMENTATIONS //
    ///////////////////////////////////

    /*
      Any time you want to add another attack option to the enemy editor, you should implement it here with a getAttackStateInfo object.

      Also, include any configurable variables that you will use for this stateInfo object in the EnemyController.enemyAttackOptions list

      Each "info" function returns an object which represents an implementation of an enemy attack option.  There are three functions in each info object:
        1) setVars: sets up all the variables needed for the attack state.  Should be called within sprite.create.
        2) startAttack: checks preconditions before each attack, and does any one-time initialization before entering the attack state.  Should be called within each default state loop to check if attack should initiate
        3) attackState: the implementation of the actual attack state itself.  Upon finishing, it will reset Enemy.currentState to Enemy.defaultState

      Info functions are stored in an Enemy-scoped variable, so that they can be swapped out depending on which enemyAttackOption was chosen.

      For example: 
        // in the enemy.create method:
        if (this.attackPattern.key === 'Charge') {
          this.getAttackStateInfo = this.getChargeStateInfo;
        }
        this.getAttackStateInfo().setup();
        ...
        // in enemy.defaultState method:
        if (this.getAttackStateInfo().startAttack()) {
          this.currentState = this.getAttackStateInfo().attackState;
        }
    */

    self.Enemy.prototype.getChargeStateInfo = function() {
      var sprite = this;
      return {
        // call in the create function
        setup: function() {
          sprite.cooldown = sprite.attackPattern.cooldown;
          sprite.cooldownClock = 0;
          sprite.chargeSpeed = sprite.attackPattern.chargeSpeed;
          sprite.chargeDuration = sprite.attackPattern.duration;
          sprite.chargeClock = 0;
          sprite.chargeRange = sprite.attackPattern.range;
        },
        // call before switching states to 'attack'
        startAttack: function() {
          if (sprite.cooldownClock) {
            sprite.cooldownClock--;
          }

          // get distance to player to check if in range
          var dist = sprite.game.math.distance(sprite.x, sprite.y, sprite.target.x, sprite.target.y);

          // if in range, and if cooldown inactive, start charge
          if (dist < sprite.chargeRange && !sprite.cooldownClock) {
            // reset cooldown, set chargeDuration clock, set direction
            sprite.cooldownClock = sprite.cooldown;
            sprite.chargeClock = sprite.chargeDuration;
            sprite.chargeRotation = sprite.game.math.angleBetween(sprite.x, sprite.y, sprite.target.x, sprite.target.y);
            return true;
          }

          return false; // attack not ready to start
        },
        // state implementation
        attackState: function() {
          // charging
          if (sprite.chargeClock) {
            sprite.chargeClock--; // duration of charge - ticks down towards 0

            sprite.animations.play('attack');

            sprite.body.velocity.setTo(
              Math.cos(sprite.chargeRotation) * sprite.chargeSpeed,
              Math.sin(sprite.chargeRotation) * sprite.chargeSpeed
            );

            // stop charging if going out of bounds
            if (sprite.right > sprite.game.width) {
              sprite.body.velocity.setTo(0, 0);
              sprite.x = sprite.game.width - sprite.offsetX;
              sprite.chargeClock = 0;
            }
            if (sprite.bottom > sprite.game.height) {
              sprite.body.velocity.setTo(0, 0);
              sprite.y = sprite.game.height - sprite.offsetY;
              sprite.chargeClock = 0;
            } else if (sprite.top < 0) {
              sprite.body.velocity.setTo(0, 0);
              sprite.y = sprite.offsetY;
              sprite.chargeClock = 0;
            }
          // done charging, back to default state
          } else {
            sprite.currentState = sprite.defaultState;
          }
        }
      };
    };

    self.Enemy.prototype.getRangedStateInfo = function() {
      var sprite = this;
      return {
        setup: function() {
          sprite.cooldown = sprite.attackPattern.cooldown;
          sprite.cooldownClock = 0;
          // create bullet pool
          sprite.bullets = sprite.game.add.group();
          for (var i = 0; i < 30; i++) {
            var bullet = sprite.game.add.sprite(0, 0, sprite.attackPattern.bullet.key);
            bullet.anchor.setTo(0.5, 0.5);
            bullet.outOfBoundsKill = true;
            sprite.game.physics.enable(bullet, Phaser.Physics.ARCADE);
            bullet.bulletSpeed = sprite.attackPattern.bulletSpeed;
            bullet.damage = sprite.damage;
            bullet.animations.add('fly');
            bullet.kill();
            sprite.bullets.add(bullet);
          }
          sprite.game.allEnemyBullets.add(sprite.bullets);

          sprite.fireBullet = function() {
            sprite.cooldownClock = sprite.cooldown;
            var bullet = sprite.bullets.getFirstDead();
            if (bullet) {
              bullet.revive();
              bullet.checkWorldBounds = true;
              bullet.outOfBoundsKill = true;
              bullet.reset(sprite.x, sprite.y);
              bullet.body.velocity.x = -bullet.bulletSpeed;
              bullet.animations.play('fly', 10, true);
            }
          };

        },
        startAttack: function() {
          // cooldown still active
          if (sprite.cooldownClock) {
            sprite.cooldownClock--;
            return false;
          }

          sprite.fireBullet();
          return true;
        },
        attackState: function() {
          // moves while firing
          sprite.move();

          // play attack animation, go back to normal movement/animation when finished
          sprite.animations.play('attack');

          // go back to normal animation when finished
          sprite.animations.currentAnim.onComplete.add(function() {
            if (sprite.cooldownClock) { // cooldown active, back to default state
              sprite.currentState = sprite.defaultState;
            } else { // cooldown inactive, continue to play attack animation and shoot another bullet
              sprite.fireBullet();
            }
          });
        }
      };
    };

    ///////////////////////////
    // OTHER STATE FUNCTIONS //
    ///////////////////////////

    self.Enemy.prototype.defaultState = function() {
      // regular movement
      this.move();
      this.animations.play('move');

      // switch states if attacking
      if (this.getAttackStateInfo().startAttack()) {
        this.currentState = this.getAttackStateInfo().attackState;
      }
    };

    // this function handles movement without playing the animation
    // (can be used in multiple states)
    self.Enemy.prototype.move = function() {

      // DEFAULT MARCHING MOVEMENT
      if (this.movePattern === 'Default') {
        this.body.velocity.setTo(-this.moveSpeed, 0);

      // FOLLOWING MOVEMENT
      } else if (this.movePattern === 'Follow') {
        // get distance to playerSprite
        var distance = this.game.math.distance(this.x, this.y, this.target.x, this.target.y);

        // if enemy to the right or within 150px, chase
        if (distance < 150 || this.x > this.target.x) {
          // Calculate the angle to the target
          var rotation = this.game.math.angleBetween(this.x, this.y, this.target.x, this.target.y);

          // move towards player without 'shaking'
          if (distance < this.moveSpeed) {
            this.body.velocity.setTo(
              Math.cos(rotation) * distance,
              Math.sin(rotation) * distance
            );
          } else {
            // set velocity vector based on rotation and speed
            this.body.velocity.setTo(
                Math.cos(rotation) * this.moveSpeed,
                Math.sin(rotation) * this.moveSpeed
            );
          }
        } else { // leave the player alone and continue march
          this.body.velocity.setTo(-this.moveSpeed, 0);
        }

      // MOVE DATA ERROR
      } else {
        throw new Error('Move-pattern key unrecognized');
      }
    };
  

    ///////////////////
    // INIT FUNCTION //
    ///////////////////

    function init() {
      $http.get('/api/enemies')
        .success(function(data) {
          allEnemies = data.allEnemyData;
          LoaderService.enemy = true;
          LoaderService.loadHandler();
        })
        .error(function(data) {
          MessageService.setFlashMessage(data.message, true);
        });
    }

  }
]);
// This service handles all "save" requests to the API
app.service('LevelService', [
  '$http', 'LoaderService', 'MessageService',
  function($http, LoaderService, MessageService) {

    var self = this;

    var allLevels;
    self.getAllLevels = function() {
      return allLevels;
    };

    self.getLevel = function(num) {
      return allLevels[num];
    };

    init();

    self.saveLevel = function(levelData) {
      // request to server to save the level data
      $http.post('../api/save/stage', levelData)
        .success(function(data) {
          allLevels = data.allLevelData;
          MessageService.setFlashMessage(data.message, false);
        })
        .error(function(data) {
          MessageService.setFlashMessage(data.message, true);
        });
    };

    function init() {
      $http.get('../api/stages')
        .success(function(data) {
          // set currentLevel
          allLevels = data.allLevelData;
          LoaderService.level = true;
          LoaderService.loadHandler();
        })
        .error(function(data) {
          MessageService.setFlashMessage(data.message, true);
        });
    }
  }
]);
/*
 * LOADER SERVICE
 *
 * This service keeps track of whether all game components have been loaded.
 * Once all game components have been loaded, it calls any callbacks that
 * are dependent on the loaded game components.  Callbacks are added via
 * LoaderService.addLoaderFunction
 * 
 */
app.service('LoaderService', 
  function() {

    var self = this;

    self.assets = false;
    self.enemy = false;
    self.level = false;
    self.player = false;
    self.weapon = false;

    var loaderFunctions = [];

    // dependent components call this before they execute dependent blocks of code
    self.addLoaderFunction = function(callback) {
      if (loaded()) {
        callback();
      } else {
        loaderFunctions.push(callback);
      }
    };

    // loading services call this when they have loaded
    self.loadHandler = function() {
      if (loaded()) { // if all services have loaded, call all callbacks
        for (var i = 0; i < loaderFunctions.length; i++) {
          loaderFunctions[i]();
        }
      }
    };

    // check to see if all dependencies have loaded
    function loaded() {
      return self.assets && self.enemy && self.level && self.player;
    }
  });
app.service('MessageService',
  ['$rootScope', 
  function($rootScope) {

    var self = this;

    var colors = {
      RED: '#E8130C',
      GREEN: '#00B20B'
    };

    var flashMessage = {
      visible: false,
      message: '',
      color: colors.GREEN
    };

    self.setFlashMessage = function(message, isBad) {
      flashMessage.message = message;
      flashMessage.color = colors.GREEN;
      if (isBad) {
        flashMessage.color = colors.RED;
        if (!message) {
          flashMessage.message = 'An unknown error occured.';
        }
      }
      flashMessage.visible = true;
        // hide after 3s
      setTimeout(
        function(){
          $rootScope.$apply(function() {
            self.hideFlashMessage(); 
          });
        }, 3000);
    };

    self.getFlashMessage = function() {
      return flashMessage;
    };

    self.hideFlashMessage = function() {
      flashMessage.visible = false;
    };
  }
]);
app.service('PersistenceService', 
  ['LevelService', 'PlayerService', 'WeaponService',
  function(LevelService, PlayerService, WeaponService) {
    var self = this;

    var playerData = {};
    self.getPlayerData = function() {
      return PlayerService.getPlayer('Mage');
    };

    // hardcoded default weapon. changes when you equip something else
    var currentWeapon = {
      "name": "Starting Dagger",
      "description": "This old, chipped dagger doesn't look too intimidating.",
      "rarity": "Common",
      "class": "Mage",
      "level": 1,
      "damageBoost": 0,
      "firePattern": "SingleBullet",
      "spritesheet": {
        "type": "Bullets",
        "name": "dagger-right",
        "width": 64,
        "height": 22,
        "key": "dagger-right",
        "src": "../game/assets/rusty-dagger.png"
      }
    };
    self.getCurrentWeapon = function() {
      return currentWeapon;
    };
    self.setCurrentWeapon = function(newWeapon) {
      currentWeapon = newWeapon;
    };

    var currentLevel = 1;
    self.getCurrentLevel = function(game) {
      var levelData = LevelService.getLevel(currentLevel);
      while (!levelData) {
        if (currentLevel > 10) {
          game.state.start('win');
          currentLevel = 1;
          return false;
        }
        currentLevel++;
        levelData = LevelService.getLevel(currentLevel);
      }
      return levelData;
    };

    self.nextLevel = function(game) {
      currentLevel++;
      if (self.getCurrentLevel(game)) {
        game.state.start('prelevel');
      }
    };
  }
]);
app.service('PlayerService', 
  ['$http', 'DamageService', 'LoaderService', 'WeaponService',
  function($http, DamageService, LoaderService, WeaponService) {

    var self = this;

    var allPlayers = {};
    self.getAllPlayers = function() {
      return allPlayers;
    };
    self.getPlayer = function(key) {
      return allPlayers[key];
    };

    init();

    ///////////////////////
    // PLAYER OBJECT DEF //
    ///////////////////////

    self.Player = function(game, x, y, data, weaponData) {
      this.game = game;

      // create sprite
      Phaser.Sprite.call(this, this.game, x, y, data.spritesheet.key);
      // init animations
      this.animations.add('move', data.moveFrames, data.moveFps);

      // shadow
      var shadow = this.game.add.sprite(0, 32, 'shadow');
      shadow.anchor.setTo(0.5, 0.5);
      this.game.layers.shadows.add(shadow);
      var player = this;
      shadow.update = function() {
        this.x = player.x;
        this.y = player.y + (player.height / 2);
        if (player.health <= 0) {
          this.pendingDestroy = true;
        }
      };

      // physics
      this.game.physics.enable(this, Phaser.Physics.ARCADE);
      this.body.collideWorldBounds = true;
      this.anchor.setTo(0.5, 0.5);
      this.body.drag.setTo(1450, 1450); // x, y

      // damage logic flags
      this.invincible = false;
      this.flashing = false;
      this.flashTimer = 0;

      // stats and movement configuration
      this.health = data.health;
      this.damage = data.damage;
      this.maxSpeed = data.moveSpeed;
      this.diagSpeed = this.maxSpeed / Math.sqrt(2);
      this.acceleration = 1500;

      // weapon
      this.weaponData = weaponData;
      this.weapon = WeaponService.getFirePattern(this.weaponData.firePattern);
      this.weapon.create(this.game, this.weaponData);

      // controls
      this.cursors = this.game.input.keyboard.createCursorKeys();
      this.game.input.keyboard.addKeyCapture([Phaser.Keyboard.SPACEBAR]);
    
      // add to game
      this.game.add.existing(this);
    };

    self.Player.prototype = Object.create(Phaser.Sprite.prototype);
    self.Player.prototype.constructor = self.Player;

    self.Player.prototype.update = function() {

      DamageService.flash(this);

      this.move();
      this.animations.play('move');

      if (this.isAttacking()) {
        this.weapon.fire(this.game, this);
      }
    };


    ///////////////////////////////////////
    // PLAYER HELPER AND STATE FUNCTIONS //
    ///////////////////////////////////////

    // this function handles movement without playing the animation
    // (can be used in multiple states)
    self.Player.prototype.move = function() {
      // move player without choosing animation
      // set up min and max mvt speed
      if ((this.cursors.left.isDown || this.cursors.right.isDown) &&
         (this.cursors.up.isDown || this.cursors.down.isDown)) {
         this.body.maxVelocity.setTo(this.diagSpeed, this.diagSpeed); // x, y
      } else {
         this.body.maxVelocity.setTo(this.maxSpeed, this.maxSpeed); // x, y
      }

      // movement and controls
      if (this.cursors.left.isDown) {
       this.body.acceleration.x = -this.acceleration;
      } else if (this.cursors.right.isDown) {
         this.body.acceleration.x = this.acceleration;
      } else {
         this.body.acceleration.x = 0;
      }

      if (this.cursors.up.isDown) {
       this.body.acceleration.y = -this.acceleration;
      } else if (this.cursors.down.isDown) {
       this.body.acceleration.y = this.acceleration;
      } else {
       this.body.acceleration.y = 0;
      }
    };

    // handle attack input
    self.Player.prototype.isAttacking = function() {
      return this.game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR);
    };

    ///////////////////
    // INIT FUNCTION //
    ///////////////////

    function init() {
      $http.get('/api/players')
        .success(function(data) {
          allPlayers = data.allPlayerData;
          LoaderService.player = true;
          LoaderService.loadHandler();
        })
        .error(function(data) {
          MessageService.setFlashMessage(data.message, true);
        });
    }

  }
]);
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
app.controller('GameController', 
  ['AssetService', 'BossService', 'DamageService', 'EnemyService', 'LevelService', 'LoaderService', 'PersistenceService', 'PlayerService', 'WeaponService',
  function(AssetService, BossService, DamageService, EnemyService, LevelService, LoaderService, PersistenceService, PlayerService, WeaponService) {

    // wait for everything to load... then define game states
    LoaderService.addLoaderFunction(function() {

      /////////////////////////
      // MAIN GAMEPLAY STATE //
      /////////////////////////

      var gameplayState = {
        preload: function() {
          // load google font
          game.load.script('webfont', '//ajax.googleapis.com/ajax/libs/webfont/1/webfont.js');

          // load FX sprites
          game.load.spritesheet('death', '../api/uploads/explode.png', 50, 50);
          game.load.image('shadow', '../api/uploads/shadow.png');
          game.load.image('cursor', 'assets/cursor.png');

          // load all boss assets
          BossService.preloadBossAssets(game);

          // load all character spritesheets
          AssetService.preloadAllAssets(game);
        },

        create: function() {
          // vars
          var scrollSpeed = -100;
          this.enemyTimer = 0;
          this.levelData = PersistenceService.getCurrentLevel(game);
          this.levelCol = 0;
          this.bossSpawned = false;

          // rendering layers
          game.layers = {
            background: game.add.group(),
            shadows: game.add.group(),
            player: game.add.group(),
            enemies: game.add.group(),
            fx: game.add.group()
          };

          // lay tiles
          game.tiles = game.add.tileSprite(0, 0, game.width, game.height, this.levelData.background.key);
          game.tiles.autoScroll(scrollSpeed, 0);
          game.layers.background.add(game.tiles);

          // create death sprites
          game.deathAnimations = game.add.group();
          for (var i = 0; i < 10; i++) {
            var deathSpr = game.add.sprite(0, 0, 'death');
            deathSpr.animations.add('die');
            deathSpr.anchor.setTo(0.5, 0.5);
            deathSpr.kill();
            game.deathAnimations.add(deathSpr);
          }
          game.physics.enable(game.deathAnimations, Phaser.Physics.ARCADE);

          // create player sprite (default to mage for now)
          var playerData = PersistenceService.getPlayerData();
          var weaponData = PersistenceService.getCurrentWeapon();
          this.player = new PlayerService.Player(game, 50, game.world.centerY, playerData, weaponData);

          // create enemy bullet pool
          game.allEnemyBullets = game.add.group();

          // create enemy sprite group
          game.enemyGroup = game.add.group();
        },

        update: function() {

          // generate enemies
          this.enemyTimer++;
          if (this.enemyTimer % 20 === 0) {
            spawnEnemy(this);
          }

          // enemy/player-bullet collision handling
          game.physics.arcade.overlap(game.enemyGroup, game.allPlayerBullets, hitEnemyByBulletHandler);

          // player/enemy-bullet collision handling
          for (var i = 0; i < game.allEnemyBullets.children.length; i++) {
            subgroup = game.allEnemyBullets.children[i];
            game.physics.arcade.overlap(this.player, subgroup, hitPlayerByBulletHandler, hitPlayerProcess);
          }

          // player/enemy collision handling
          game.physics.arcade.overlap(this.player, game.enemyGroup, hitPlayerByEnemyHandler, hitPlayerProcess);
          // enemy/enemy collision handling
          game.physics.arcade.collide(game.enemyGroup);
        }
      };

      /* GAMEPLAY HELPER METHODS */

      // collision is registered only if this func returns true
      var hitPlayerProcess = function(player) {
        return !player.invincible;
      };

      // kill bullet, damage enemy
      var hitEnemyByBulletHandler = function(enemy, bullet) {
        bullet.kill();
        // create "bullet dust"
        DamageService.takeDamage(enemy, 1);
      };

      // kill bullet, damage player
      var hitPlayerByBulletHandler = function(player, bullet) {
        bullet.kill();
        // create "bullet dust"
        DamageService.takeDamage(player, bullet.damage, true);
      };

      // player takes damage if hit by enemy
      var hitPlayerByEnemyHandler = function(player, enemy) {
        DamageService.takeDamage(player, enemy.damage, true);
      };

      function spawnEnemy(state) {
        if (state.bossSpawned) {
          return;
        }
        var col = state.levelData.enemies[state.levelCol];
        if (!col) {
          // done spawning enemies, spawn boss (serpent 'Biscione' by default for now, will later be saved in levelData)
          state.bossSpawned = true;
          var boss = new BossService.Biscione(game, game.width, 250);
          // fade out and move to loot state if boss dead
          boss.events.onDestroy.add(function() {
            game.time.events.add(5000, function() {
              var fadeout = game.add.tween(game.tiles).to({ alpha: 0 }, 500, "Linear", true, 0);
              fadeout.onComplete.add(function() {
                game.time.events.add(1000, function() {
                  game.state.start('loot');
                });
              });
            });
          });
          game.enemyGroup.add(boss);
        } else if (!state.pendingNextLevel) {
          for (var i = 0; i < col.length; i++) {
            var enemyData = EnemyService.getEnemy(col[i]);
            if (enemyData) {
              var enemy = new EnemyService.Enemy(
                game, // game
                game.width, // x
                0, // y
                enemyData, // data
                state.player // target sprite
              );
              enemy.y = (i * 50) + (enemy.height / 2); // position enemy vertically
              game.enemyGroup.add(enemy);
            }
          }
          state.levelCol++;
        }
      }

      ////////////////
      // BOOT STATE //
      ////////////////

      var bootState = {
        preload: function() {
          // preload loading sprite
          game.load.spritesheet('load-ghost', 'assets/load-ghost.png', 24, 36);
          // preload font
          game.load.bitmapFont('carrier_command', 'assets/carrier_command.png', 'assets/carrier_command.xml');
        },
        create: function() {
          // load physics
          game.physics.startSystem(Phaser.Physics.ARCADE);
          game.state.start('load');
        }
      };

      ////////////////
      // LOAD STATE //
      ////////////////

      var loadState = {
        preload: function() {
          // display loading sprite/text and preload everything
          var loadSprite = game.add.sprite(game.world.centerX, game.world.centerY - 45, 'load-ghost');
          loadSprite.anchor.setTo(0.5, 0.5);
          loadSprite.animations.add('move', [0,1,2,3,4], 10, true);
          loadSprite.animations.play('move');

          // loading text
          this.loadingText = game.add.bitmapText(game.world.centerX, game.world.centerY, 'carrier_command', 'LOADING', 14);
          this.loadingText.anchor.setTo(0.5, 0.5);
          this.textTimer = 0;
          this.tochki = 0;
          this.minLoadscreenTime = 100;

          // loading assets
          AssetService.preloadAllAssets(game);
        },
        update: function() {
          // increment ellipses
          this.textTimer++;
          if (this.textTimer % 25 === 0) {
            this.tochki++;
            this.tochki = this.tochki > 3 ? 0 : this.tochki;
            this.loadingText.text = 'LOADING';
            for (var i = 0; i < this.tochki; i++) {
              this.loadingText.text += '.';
            }
          }

          if (this.textTimer >= this.minLoadscreenTime) {
            game.state.start('mainMenu');
          }
        }
      };

      /////////////////////
      // MAIN MENU STATE //
      /////////////////////

      var mainMenuState = {
        create: function() {

          var menuText = game.add.bitmapText(game.world.centerX, game.world.centerY, 'carrier_command', 'Trace Italienne', 32);
          menuText.anchor.setTo(0.5,0.5);

          var startText = game.add.bitmapText(game.world.centerX, game.world.height - 32, 'carrier_command', 'Press \'SPACE\' to start', 14);
          startText.anchor.setTo(0.5, 0.5);
          startText.alpha = 0;
          this.startTween = game.add.tween(startText).to({ alpha: 1 }, 380, "Linear", true, 0, -1, true);

          this.space = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
          this.prevSpace = false;
        },
        update: function() {
          if (this.space.isDown && !this.prevSpace) {
            this.prevSpace = true;
            this.startTween.timeScale = 5;

            game.time.events.add(800, function() {
                game.state.start('prelevel');
            });
          }
        }
      };

      ////////////////////////
      // LEVEL INTRO SCREEN //
      ////////////////////////

      var prelevelState = {
        create: function() {
          var levelData = PersistenceService.getCurrentLevel(game);
          var scrollSpeed = -100;

          this.bg = game.add.tileSprite(0, 0, game.width, game.height, levelData.background.key);
          this.bg.autoScroll(scrollSpeed, 0);

          var levelText = 'Level ' + levelData.number + ': ' + levelData.title;
          var title = game.add.bitmapText(game.world.centerX, game.world.centerY - 64, 'carrier_command', levelText, 32);
          title.anchor.setTo(0.5, 0.5);

          var description = game.add.bitmapText(game.world.centerX, game.world.centerY + 64, 'carrier_command', levelData.description, 14);
          description.anchor.setTo(0.5, 0.5);

          var startText = game.add.bitmapText(game.world.centerX, game.world.height - 32, 'carrier_command', 'Press \'SPACE\' to start', 14);
          startText.anchor.setTo(0.5, 0.5);
          startText.alpha = 0;
          this.startTween = game.add.tween(startText).to({ alpha: 1 }, 380, "Linear", true, 0, -1, true);

          this.space = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
          this.prevSpace = false;
        },
        update: function() {
          if (this.space.isDown && !this.prevSpace) {
            this.prevSpace = true;
            // stop scrolling, fade out bg, then start gameplay
            this.bg.autoScroll(0, 0);
            this.startTween.timeScale = 5;

            var bgTween = game.add.tween(this.bg).to({ alpha: 0 }, 500, "Linear", true, 0);
            bgTween.onComplete.add(function() {
              game.time.events.add(500, function() {
                game.state.start('gameplay');
              }, this);
            }, this);
          }
        }
      };

      ////////////////
      // LOOT STATE //
      ////////////////

      var lootState = {
        create: function() {
          // title text
          game.add.bitmapText(game.world.centerX, 32, 'carrier_command', 'You found weapons!', 32).anchor.setTo(0.5, 0.5);
          var instruct = game.add.bitmapText(game.world.centerX, 64, 'carrier_command', 'Press SPACE to equip a weapon or ENTER to start the next level', 8);
          instruct.anchor.setTo(0.5, 0.5);
          var instructTween = game.add.tween(instruct).to({ alpha: 0.3 }, 500, "Linear", true, 0, -1, true);

          // create player sprite to demo the weapon
          var playerData = PersistenceService.getPlayerData();
          var weaponData = PersistenceService.getCurrentWeapon();
          var player = new PlayerService.Player(game, game.world.centerX, game.world.centerY, playerData, weaponData);
          // override update function
          player.update = function() {
            this.animations.play('move');
            this.weapon.fire(game, this);
          };

          // loot list
          var loot = WeaponService.getLoot(playerData.level, playerData.name);
          loot.unshift(weaponData);
          var currentChoice = 0;

          var weaponsList = game.add.bitmapText(22, game.world.height - 8, 'carrier_command', updateList(), 8);
          weaponsList.anchor.setTo(0, 1);

          // create cursor
          var cursor = game.add.sprite(14, weaponsList.y - weaponsList.height + 11, 'cursor');
          cursor.anchor.set(0.5);
          var startPos = cursor.y;
          game.add.tween(cursor).to({ alpha: 0 }, 100, "Linear", true, 0, -1, true);

          // set controls
          var up = game.input.keyboard.addKey(Phaser.Keyboard.UP);
          var down = game.input.keyboard.addKey(Phaser.Keyboard.DOWN);
          var enter = game.input.keyboard.addKey(Phaser.Keyboard.ENTER);
          var space = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

          // go up in the list, move cursor
          up.onDown.add(function() {
            currentChoice--;
            if (currentChoice < 0) {
              currentChoice = loot.length - 1;
            }
            cursor.y = startPos + (currentChoice * 16);
          });

          // up down in the list, move cursor
          down.onDown.add(function() {
            currentChoice++;
            if (currentChoice > loot.length - 1) {
              currentChoice = 0;
            }
            cursor.y = startPos + (currentChoice * 16);
          });

          // go to next level on ENTER
          enter.onDown.add(function() {
            instructTween.timeScale = 5;
            game.time.events.add(800, function() {
              console.log(PersistenceService);
              PersistenceService.nextLevel(game);
            }, this);
          });

          // display info about equipped weapon
          var weaponInfoText = game.add.bitmapText(game.width / 3 * 2, game.world.height - 24, 'carrier_command', updateInfo(), 8);
          weaponInfoText.anchor.setTo(0, 1); // left aligned
          weaponInfoText.maxWidth = game.width / 3;

          // equip a weapon on SPACE
          space.onDown.add(function() {
            // set weapon in persistence service
            weaponData = loot[currentChoice];
            PersistenceService.setCurrentWeapon(weaponData);

            // destroy and reload player
            player.pendingDestroy = true;
            player = new PlayerService.Player(game, game.world.centerX, game.world.centerY, playerData, weaponData);
            // override update function
            player.update = function() {
              this.animations.play('move');
              this.weapon.fire(game, this);
            };

            // refresh display text
            weaponInfoText.text = updateInfo();
            weaponsList.text = updateList();
          });

          // updating text functions
          function updateList() {
            var text = '-- LOOT --\n\n';
            for (var i = 0; i < loot.length; i++) {
              text += loot[i].name;
              if (i === currentChoice) {
                text += ' - equipped';
              }
              text += '\n\n';
            }
            return text;
          }

          function updateInfo() {
            var text = '-- equipped --\n\n';
            var weapon = loot[currentChoice];
            text += 'Name: ' + weapon.name + '\n\n';
            text += 'Rarity: ' + weapon.rarity + '\n\n';
            text += 'Required LV: ' + weapon.level + '\n\n';
            text += 'Damage: ' + weapon.damageBoost + '\n\n';
            text += 'Attack Type: ' + weapon.firePattern + '\n\n';
            return text;
          }
        }
      };

      ////////////////
      // LOSE STATE //
      ////////////////

      var loseState = {
        create: function() {
          game.add.tween(game.world).to({ alpha: 1 }, 500, "Linear", true);
          // header
          game.add.bitmapText(game.world.centerX, game.world.centerY, 'carrier_command', 'You died', 32)
            .anchor.setTo(0.5, 0.5);

          // menu options
          var retry = game.add.bitmapText(game.world.centerX, game.world.centerY + 96, 'carrier_command', 'Retry', 14);
          retry.anchor.setTo(0.5, 0.5);
          var quit = game.add.bitmapText(game.world.centerX, game.world.centerY + 124, 'carrier_command', 'Main Menu', 14);
          quit.anchor.setTo(0.5, 0);

          // create cursor
          var cursor = game.add.sprite(
            game.world.centerX - 96, // x
            game.world.centerY + 96, // y
            'cursor'); // sprite key
          cursor.anchor.setTo(0.5, 0.5);
          var startPos = cursor.y;
          // game.add.tween(cursor).to({ alpha: 0 }, 100, "Linear", true, 0, -1, true);

          var currentChoice = 0;
          var selected = false;

          // set controls
          var up = game.input.keyboard.addKey(Phaser.Keyboard.UP);
          var down = game.input.keyboard.addKey(Phaser.Keyboard.DOWN);
          var enter = game.input.keyboard.addKey(Phaser.Keyboard.ENTER);
          var space = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

          // go up in the list, move cursor
          up.onDown.add(function() {
            if (selected) return;
            currentChoice--;
            if (currentChoice < 0) {
              currentChoice = 1;
            }
            cursor.y = startPos + (currentChoice * 36);
          });

          // up down in the list, move cursor
          down.onDown.add(function() {
            if (selected) return;
            currentChoice++;
            if (currentChoice > 1) {
              currentChoice = 0;
            }
            cursor.y = startPos + (currentChoice * 36);
          });

          // event handler if enter or space is chosen
          var onChoice = function() {
            if (selected) return;
            selected = true;
            if (currentChoice === 0) {
              game.add.tween(retry).to({ alpha: 0 }, 80, "Linear", true, 0, -1, true);
              game.time.events.add(800, function() {
                game.state.start('prelevel');
              });
            } else {
              game.add.tween(quit).to({ alpha: 0 }, 80, "Linear", true, 0, -1, true);
              game.time.events.add(800, function() {
                game.state.start('mainMenu');
              });
            }
          };

          enter.onDown.add(onChoice);
          space.onDown.add(onChoice);
        }
      };

      ///////////////
      // WIN STATE //
      ///////////////

      var winState = {
        create: function() {
          var menuText = game.add.bitmapText(game.world.centerX, game.world.centerY, 'carrier_command', 'You win!', 32);
          menuText.anchor.setTo(0.5,0.5);

          var otherText = game.add.bitmapText(game.world.centerX, game.world.centerY + 64, 'carrier_command', 'This is where we would show end game stats, credits, etc.', 14);
          otherText.anchor.setTo(0.5, 0.5);

          var startText = game.add.bitmapText(game.world.centerX, game.world.height - 32, 'carrier_command', 'Press \'SPACE\' to go back to main menu', 14);
          startText.anchor.setTo(0.5, 0.5);
          startText.alpha = 0;
          this.startTween = game.add.tween(startText).to({ alpha: 1 }, 380, "Linear", true, 0, -1, true);

          this.space = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
          this.prevSpace = false;
        },
        update: function() {
          if (this.space.isDown && !this.prevSpace) {
            this.prevSpace = true;
            this.startTween.timeScale = 5;
            game.time.events.add(500, function() {
              game.state.start('mainMenu');
            });
          }
        }
      };

      /////////////////
      // LAUNCH GAME //
      /////////////////

      // game def
      var game = new Phaser.Game(1000, 500, Phaser.CANVAS, 'phaser-frame');

      // game states
      game.state.add('boot', bootState);
      game.state.add('load', loadState);
      game.state.add('mainMenu', mainMenuState);
      game.state.add('prelevel', prelevelState);
      game.state.add('gameplay', gameplayState);
      game.state.add('loot', lootState);
      game.state.add('lose', loseState);
      game.state.add('win', winState);

      // launch
      game.state.start('boot');
    });
  }
]);