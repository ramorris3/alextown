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

    self.saveAsset = function(spriteData, imgSrc) {
      // check for dupes
      if (allAssets.hasOwnProperty(spriteData.name)) {
        MessageService.setFlashMessage('There is already an img asset named "' + spriteData.name + '."  Asset was not saved (must have a unique name).');
        return;
      }

      // save img and get key (filename)
      $http.post('api/save/img', {img: imgSrc})
        .success(function(data) {
          // update spriteData with img reference
          spriteData.key = data.key;
          spriteData.src = data.src;
          
          $http.post('api/save/asset', spriteData)
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
      $http.get('api/assets')
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
      $http.post('api/save/enemies', enemyData)
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
          sprite.bullets.createMultiple(30, sprite.attackPattern.bullet.key);
          sprite.bullets.setAll('anchor.x', 0.5);
          sprite.bullets.setAll('anchor.y', 0.5);
          sprite.bullets.setAll('outOfBoundsKill', true);
          sprite.game.physics.enable(sprite.bullets, Phaser.Physics.ARCADE);
          sprite.game.allEnemyBullets.add(sprite.bullets);
          sprite.bulletSpeed = sprite.attackPattern.bulletSpeed;

          sprite.fireBullet = function() {
            sprite.cooldownClock = sprite.cooldown;
            var bullet = sprite.bullets.getFirstDead();
            if (bullet) {
              bullet.revive();
              bullet.checkWorldBounds = true;
              bullet.outOfBoundsKill = true;
              bullet.reset(sprite.x, sprite.y);
              bullet.body.velocity.x = -sprite.bulletSpeed;
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

    var currentLevel;
    self.getCurrentLevel = function() {
      return currentLevel;
    };

    init();

    self.saveLevel = function(filename, level, data) {
      // request to server to save the level data
      $http.post('api/save/stage', { 'filename': filename, 'level': level, 'data': data })
        .success(function(data) {
          MessageService.setFlashMessage(data.message, false);
        })
        .error(function(data) {
          MessageService.setFlashMessage(data.message, true);
        });
    };

    function init() {
      $http.get('api/stages')
        .success(function(data) {
          // set currentLevel
          currentLevel = data.levelData.data;
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
      Phaser.Sprite.call(this, this.game, x, y, data.spritesheet.key);
      // init animations
      this.animations.add('move', data.moveFrames, data.moveFps);
      this.animations.add('attack', data.attackFrames, data.attackFps);
      this.animations.add('damage', data.damageFrames, data.damageFps);
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
  ['AssetService', 'DamageService', 'EnemyService', 'LevelService', 'LoaderService', 'PlayerService',
  function(AssetService, DamageService, EnemyService, LevelService, LoaderService, PlayerService) {

    LoaderService.addLoaderFunction(function() {

      var game = new Phaser.Game(1000, 500, Phaser.CANVAS, 'phaser-frame', {preload: preload, create: create, update: update});

      function preload() {
        // load background
        game.load.image('floor', 'assets/floor.png');

        // load FX sprites
        game.load.spritesheet('death', 'api/uploads/explode.png', 50, 50);

        // load all character spritesheets
        AssetService.preloadAllAssets(game);
      }

      var tiles;
      var scrollSpeed = -75;
      var player;
      var enemyGroup;
      var enemyTimer = 0;
      var levelData = LevelService.getCurrentLevel();
      var levelCol = 0;

      function create() {

        // lay tiles
        tiles = game.add.tileSprite(0, 0, game.width, game.height, 'floor');
        tiles.autoScroll(scrollSpeed, 0);

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

        // create player sprite (default to stairfex for now)
        var playerData = PlayerService.getPlayer('stairfex');
        player = new PlayerService.Player(game, 50, game.world.centerY, playerData);

        // create enemy bullet pool
        game.allEnemyBullets = game.add.group();

        // create enemy sprite group
        enemyGroup = game.add.group();
      }

      function update() {
        // generate enemies
        enemyTimer++;
        if (enemyTimer % 120 === 0) {
          spawnEnemy();
        }

        var i;
        var subgroup;
        // enemy/player-bullet collision handling 
        for (i = 0; i < game.allPlayerBullets.children.length; i++) {
          subgroup = game.allPlayerBullets.children[i];
          game.physics.arcade.overlap(enemyGroup, subgroup, hitCharacterHandler, hitCharacterProcess);
        }

        // player/enemy-bullet collision handling
        for (i = 0; i < game.allEnemyBullets.children.length; i++) {
          subgroup = game.allEnemyBullets.children[i];
          game.physics.arcade.overlap(player, subgroup, hitCharacterHandler, hitCharacterProcess);
        }

        // player/enemy collision handling
        game.physics.arcade.overlap(player, enemyGroup, hitPlayerHandler, hitCharacterProcess);
        // enemy/enemy collision handling
        game.physics.arcade.collide(enemyGroup);
      }

      ////////////////////
      // HELPER METHODS //
      ////////////////////

      // collision is registered only if this func returns true
      var hitCharacterProcess = function(character) {
        return !character.invincible;
      };

      // kill bullet, damage enemy
      var hitCharacterHandler = function(character, bullet) {
        bullet.kill();
        // create "bullet dust"
        DamageService.takeDamage(character, 1);
      };

      var hitPlayerHandler = function(character) {
        DamageService.takeDamage(character, 1);
      };

      function spawnEnemy() {
        var col = levelData[levelCol];
        for (var i = 0; i < col.length; i++) {
          var enemyData = EnemyService.getEnemy(col[i]);
          if (enemyData) {
            var enemy = new EnemyService.Enemy(
              game, // game
              game.width, // x
              0, // y
              enemyData, // data
              player // target sprite
            );
            enemy.y = (i * 50) + (enemy.height / 2); // position enemy vertically
            enemyGroup.add(enemy);
          }
        }
        levelCol++;
      }

    });
  }
]);