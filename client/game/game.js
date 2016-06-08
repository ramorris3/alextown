app.controller('GameController', 
  ['AssetService', 'DamageService', 'EnemyService', 'LevelService', 'LoaderService', 'PlayerService',
  function(AssetService, DamageService, EnemyService, LevelService, LoaderService, PlayerService) {

    LoaderService.addLoaderFunction(function() {

      var game = new Phaser.Game(1000, 500, Phaser.CANVAS, 'phaser-frame', {preload: preload, create: create, update: update});

      function preload() {
        // load FX sprites
        game.load.spritesheet('death', '../api/uploads/explode.png', 50, 50);

        // load all character spritesheets
        AssetService.preloadAllAssets(game);
      }

      var tiles;
      var scrollSpeed = -75;
      var player;
      var enemyGroup;
      var enemyTimer = 0;
      var levelData = LevelService.getLevel(1);
      var levelCol = 0;

      function create() {

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
      }

      function update() {
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

      ////////////////////
      // HELPER METHODS //
      ////////////////////

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

    });
  }
]);