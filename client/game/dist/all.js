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
app.service('DamageService', function() {
  var self = this;
  
  // damage function for sprite and 
  self.takeDamage = function(sprite, damage) {
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
    }

    // toggle invincibility
    sprite.invincible = true;
    sprite.flashing = true;

    // set time to restore to vulnerable after
    sprite.game.time.events.add(50, function() {
      sprite.invincible = false;
    }, sprite);

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
            bullet.animations.add('fly');
            bullet.kill();
            sprite.bullets.add(bullet);
          }
          sprite.game.allEnemyBullets.add(sprite.bullets);

          // sprite.bullets.createMultiple(30, sprite.attackPattern.bullet.key);
          // sprite.bullets.setAll('anchor.x', 0.5);
          // sprite.bullets.setAll('anchor.y', 0.5);
          // sprite.bullets.setAll('outOfBoundsKill', true);
          // sprite.game.physics.enable(sprite.bullets, Phaser.Physics.ARCADE);
          // sprite.game.allEnemyBullets.add(sprite.bullets);
          // sprite.bulletSpeed = sprite.attackPattern.bulletSpeed;
          // for (var bullet in sprite.bullets) {
          //   bullet.animations.add('fly');
          //   bullet.animations.play('fly', 10, true);
          // }

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
  ['LevelService',
  function(LevelService) {
    var self = this;

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
  ['$http', 'DamageService', 'LoaderService', 
  function($http, DamageService, LoaderService) {

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

    self.Player = function(game, x, y, data) {
      this.game = game;

      // create sprite
      console.log(data.moveFrames);
      Phaser.Sprite.call(this, this.game, x, y, data.spritesheet.key);
      // init animations
      this.animations.add('move', data.moveFrames, data.moveFps);
      this.animations.add('attack', data.attackFrames, data.attackFps);
      this.animations.add('damage', data.damageFrames, data.damageFps);
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

      //var shadow = this.addChild(this.game.add.sprite(0, this.height / 2), 'shadow');

      // physics
      this.game.physics.enable(this, Phaser.Physics.ARCADE);
      this.body.collideWorldBounds = true;
      this.anchor.setTo(0.5, 0.5);
      this.body.drag.setTo(1450, 1450); // x, y

      // damage logic flags
      this.invincible = false;
      this.flashing = false;
      this.flashTimer = 0;

      // configuration
      this.health = data.health;
      this.damage = data.damage;
      this.maxSpeed = data.moveSpeed;
      this.diagSpeed = this.maxSpeed / Math.sqrt(2);
      this.acceleration = 1500;
      this.attackPattern = data.attackPattern;
      this.cooldown = this.attackPattern.cooldown;
      this.cooldownClock = 0;
      if (this.attackPattern.key === 'Ranged') {
        // create bullet pool
        this.bullets = this.game.add.group();
        this.bullets.createMultiple(30, this.attackPattern.bullet.key);
        this.bullets.setAll('anchor.x', 0.5);
        this.bullets.setAll('anchor.y', 0.5);
        this.bullets.setAll('outOfBoundsKill', true);
        this.game.physics.enable(this.bullets, Phaser.Physics.ARCADE);
        // for (var bullet in this.bullets) {
        //   bullet.animations.add('fly');
        // }
        this.game.allPlayerBullets.add(this.bullets);
        // bullet speed
        this.bulletSpeed = this.attackPattern.bulletSpeed;
      }
      // melee?

      // state config
      this.currentState = this.defaultState;

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

      // tick the attack cooldown clock
      if (this.cooldownClock > 0) {
        this.cooldownClock--;
      }

      // state function (includes animation)
      this.currentState();
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

    self.Player.prototype.isAttacking = function() {
      return this.game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR);
    };

    /////////////////////
    // STATE FUNCTIONS //
    /////////////////////

    self.Player.prototype.defaultState = function() {
      // move the player and play move animation
      this.move();
      this.animations.play('move');

      // switch states
      // if attacking
      if (this.isAttacking()) {
        this.currentState = this.attackState;
      }
    };

    self.Player.prototype.attackState = function() {
      // can move while firing
      this.move();

      // RANGED ATTACK
      if (this.attackPattern.key === 'Ranged') { 
        if (!this.cooldownClock) { // cooldown inactive
          // fire bullet
          this.cooldownClock = this.cooldown;
          var bullet = this.bullets.getFirstDead();
          if (bullet) {
            bullet.revive();
            bullet.checkWorldBounds = true;
            bullet.outOfBoundsKill = true;
            bullet.reset(this.x, this.y);
            bullet.body.velocity.x = this.bulletSpeed;
            //bullet.animations.play('fly', 10, true);
          }
        }
      // MELEE ???
      // AOE ???

      // UNSPECIFIED
      } else {
        throw new Error('Attack-pattern key not recognized in PlayerService.js');
      }

      this.animations.play('attack');

      // STATE ROUTING
      // go back to default if animation is finished
      var sprite = this;
      this.animations.currentAnim.onComplete.add(function() {
        if (sprite.isAttacking()) {
          sprite.currentState = sprite.attackState;
        } else {
          sprite.currentState = sprite.defaultState;
        }
      }, sprite.game);
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
app.controller('GameController', 
  ['AssetService', 'DamageService', 'EnemyService', 'LevelService', 'LoaderService', 'PersistenceService', 'PlayerService',
  function(AssetService, DamageService, EnemyService, LevelService, LoaderService, PersistenceService, PlayerService) {

    // wait for everything to load... then define game states
    LoaderService.addLoaderFunction(function() {

      /////////////////////////
      // MAIN GAMEPLAY STATE //
      /////////////////////////

      var gameplayState = {
        preload: function() {
          // load FX sprites
          game.load.spritesheet('death', '../api/uploads/explode.png', 50, 50);
          game.load.image('shadow', '../api/uploads/shadow.png');

          // load all character spritesheets
          AssetService.preloadAllAssets(game);
        },

        create: function() {
          // vars
          var scrollSpeed = -100;
          this.enemyTimer = 0;
          this.levelData = PersistenceService.getCurrentLevel(game);
          this.levelCol = 0;
          this.pendingNextLevel = false;

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

          // create player bullet pool
          game.allPlayerBullets = game.add.group();

          // create player sprite (default to knight for now)
          var playerData = PlayerService.getPlayer('knight');
          this.player = new PlayerService.Player(game, 50, game.world.centerY, playerData);

          // create enemy bullet pool
          game.allEnemyBullets = game.add.group();

          // create enemy sprite group
          this.enemyGroup = game.add.group();
        },

        update: function() {
          // generate enemies
          this.enemyTimer++;
          if (this.enemyTimer % 20 === 0) {
            spawnEnemy(this);
          }

          var i;
          var subgroup;
          // enemy/player-bullet collision handling 
          for (i = 0; i < game.allPlayerBullets.children.length; i++) {
            subgroup = game.allPlayerBullets.children[i];
            game.physics.arcade.overlap(this.enemyGroup, subgroup, hitCharacterHandler, hitCharacterProcess);
          }

          // player/enemy-bullet collision handling
          for (i = 0; i < game.allEnemyBullets.children.length; i++) {
            subgroup = game.allEnemyBullets.children[i];
            game.physics.arcade.overlap(this.player, subgroup, hitCharacterHandler, hitCharacterProcess);
          }

          // player/enemy collision handling
          game.physics.arcade.overlap(this.player, this.enemyGroup, hitPlayerHandler, hitCharacterProcess);
          // enemy/enemy collision handling
          game.physics.arcade.collide(this.enemyGroup);
        }
      };

      /* GAMEPLAY HELPER METHODS */

      // collision is registered only if this func returns true
      var hitCharacterProcess = function(character) {
        return !character.invincible;
      };

      // kill bullet, damage character (player or enemy)
      var hitCharacterHandler = function(character, bullet) {
        bullet.kill();
        // create "bullet dust"
        DamageService.takeDamage(character, 1);
      };

      // player takes damage if hit by enemy
      var hitPlayerHandler = function(player) {
        DamageService.takeDamage(player, 1);
      };

      function spawnEnemy(state) {
        var col = state.levelData.enemies[state.levelCol];
        if (!col) {
          state.pendingNextLevel = true;
          game.time.events.add(5000, function() {
            var fadeout = game.add.tween(game.tiles).to({ alpha: 0 }, 500, "Linear", true, 0);
            fadeout.onComplete.add(function() {
              game.time.events.add(1000, function() {
                PersistenceService.nextLevel(game);
              });
            });
          });
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
              state.enemyGroup.add(enemy);
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

      //////////////////
      // LEVEL SCREEN //
      //////////////////

      var prelevelState = {
        create: function() {
          console.log('here');
          var levelData = PersistenceService.getCurrentLevel(game);
          console.log(levelData);
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

      ///////////////
      // WIN STATE //
      ///////////////

      var winState = {
        create: function() {
          console.log('WIN STATE STARTED');
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
      game.state.add('win', winState);

      // launch
      game.state.start('boot');
    });
  }
]);