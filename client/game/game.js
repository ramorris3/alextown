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
            fx: game.add.group(),
            ui: game.add.group()
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
          game.layers.enemies.add(game.enemyGroup); //rendering layer

          // create damage text group
          game.damageNums = game.add.group();
          for (i = 0; i < 99; i++) {
            var dmgText = game.add.bitmapText(0, 0, 'carrier_command', '', 12);
            dmgText.anchor.setTo(0.5, 0.5);
            dmgText.kill();
            game.damageNums.add(dmgText);
          }
          game.layers.ui.add(game.damageNums); // top rendering layer
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
          var boss = new BossService.Biscione(game, game.width - 350, 250);
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