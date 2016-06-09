app.controller('GameController', 
  ['AssetService', 'DamageService', 'EnemyService', 'LevelService', 'LoaderService', 'PlayerService',
  function(AssetService, DamageService, EnemyService, LevelService, LoaderService, PlayerService) {

    // wait for everything to load... then define game states
    LoaderService.addLoaderFunction(function() {

      /////////////////////////
      // MAIN GAMEPLAY STATE //
      /////////////////////////

      var tiles;
      var scrollSpeed = -75;
      var player;
      var enemyGroup;
      var enemyTimer = 0;
      var levelData = LevelService.getLevel(1);
      var levelCol = 0;

      var gameplayState = {
        preload: function() {
          // load FX sprites
          game.load.spritesheet('death', '../api/uploads/explode.png', 50, 50);

          // load all character spritesheets
          AssetService.preloadAllAssets(game);
        },

        create: function() {

          // lay tiles
          tiles = game.add.tileSprite(0, 0, game.width, game.height, levelData.background.key);
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
        },

        update: function() {
          // generate enemies
          enemyTimer++;
          if (enemyTimer % 50 === 0) {
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

      function spawnEnemy() {
        var col = levelData.enemies[levelCol];
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
          this.menuText = game.add.bitmapText(game.world.centerX, game.world.centerY, 'carrier_command', 'Trace Italienne', 32);
          this.menuText.anchor.setTo(0.5,0.5);

          this.startText = game.add.bitmapText(game.world.centerX, game.world.height - 32, 'carrier_command', 'Press SPACE to start', 14);
          this.startText.anchor.setTo(0.5, 0.5);
          this.startText.alpha = 0;
          var tween = game.add.tween(this.startText).to({ alpha: 1 }, 380, "Linear", true, 0, -1, true);

          this.spacebar = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
        },
        update: function() {
          if (this.spacebar.isDown) {
            game.state.start('gameplay');
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
      game.state.add('gameplay', gameplayState);

      // launch
      game.state.start('boot');
    });
  }
]);