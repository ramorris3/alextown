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

          // load all character spritesheets
          AssetService.preloadAllAssets(game);
        },

        create: function() {
          var scrollSpeed = -100;
          this.enemyTimer = 0;
          this.levelData = PersistenceService.getCurrentLevel(game);
          this.levelCol = 0;
          this.pendingNextLevel = false;

          // lay tiles
          game.tiles = game.add.tileSprite(0, 0, game.width, game.height, this.levelData.background.key);
          game.tiles.autoScroll(scrollSpeed, 0);

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