app.controller('EnemyController',
  ['$http', '$scope', 'AssetService', 'DamageService', 'FileReader', 'EnemyService', 'MessageService', 'PlayerService', 
  function($http, $scope, AssetService, DamageService, FileReader, EnemyService, MessageService, PlayerService) {

    // init message
    MessageService.setFlashMessage('Choose an enemy from the list or build your own.  Then click "spawn" to test it out.', false);

    ////////////////////////////
    // MODEL VARS AND METHODS //
    ////////////////////////////

    $scope.enemyData = {};
    $scope.getAllEnemies = EnemyService.getAllEnemies;
    $scope.showDebug = false; // shows fps and sprite/stat info
    $scope.spawnTimer = 120; // frames between each enemy spawn

    $scope.reloadEditor = function() {
      if (!dataIsValid()) {
        return;
      }
      if (editor) {
        editor.state.start(editor.state.current);
      } else {
        loadEditor();
      }
    };

    $scope.moveOptions = [
      'Default',
      'Follow'
    ];

    $scope.getBullets = AssetService.getBullets;
    $scope.getSprites = AssetService.getEnemies;

    $scope.enemyAttackOptions = {
      'Charge': {
        key: 'Charge',
        cooldown: 250, // num frames
        chargeSpeed: 800, // px per frame
        duration: 30, // num frames
        range: 300
      },
      'Ranged': {
        key: 'Ranged',
        cooldown: 60, // num frames
        bullet: $scope.getBullets(),
        bulletSpeed: 350 // px per second
      }
    };

    /*
      PLAYER DATA IS HARD-CODED FOR NOW
      Player assets and data objects are local vars
      because they will not be manipulated by the UI,
      they will be loaded by PlayerService (eventually)
    */
    var playerData = {
      // General
      name: 'stairfex', // NAME MUST BE UNIQUE
      description: 'stairfex always beats morio',
      // stats
      health: 20,
      damage: 1,
      // movement
      moveSpeed: 300,
      // Assets (preload)
      // main sheet contains move, attack, and damaged animations
      spritesheet: {
        "type": "Players",
        "name": "Stairfex",
        "width": 50,
        "height": 50,
        "key": "stairfex",
        "src": "../api/uploads/stairfex.png"
      },
      // animations
      moveFrames: [0,1],
      moveFps: 10,
      attackFrames: [2,3],
      attackFps: 10,
      // attack patterns
      attackPattern: {
        key: 'Ranged',
        cooldown: 10, // num frames
        bullet: {
          "type": "Bullets",
          "name": "Blue",
          "width": 12,
          "height": 12,
          "key": "blue-bullet",
          "src": "../api/uploads/blue-bullet.png"
        },
        bulletSpeed: 700 // px per second
      }
    };

    // saves the enemy
    $scope.saveEnemy = function() {
      // send enemyobject to EnemyService to save
      if (dataIsValid) {
        EnemyService.saveEnemy($scope.enemyData, $scope.reloadEditor);
      }
    };

    function dataIsValid() {
      var data = $scope.enemyData;

      if (typeof data !== 'object' || !data) {
        MessageService.setFlashMessage('Data from enemy form is corrupt.', true);
        return false;
      }
      if (!data.name || !data.description) {
        MessageService.setFlashMessage('You need to enter a name and a description for this enemy', true);
        return false;
      }
      if (data.name === '0') {
        MessageService.setFlashMessage('Choose a name other than "0."', true);
        return false;
      }
      // stats
      if (!data.health || !data.damage) {
        MessageService.setFlashMessage('You need to specify health and damage.', true);
        return false;
      }
      // movement
      if (!data.moveSpeed || !data.movePattern) {
        MessageService.setFlashMessage('You need to specify the movement speed and type.', true);
        return false;
      }
      // sprite
      if (!data.spritesheet) {
        MessageService.setFlashMessage('You need to choose a spritesheet for this enemy.', true);
        return false;
      }
      if (!data.spritesheet.key || !data.spritesheet.src) {
        MessageService.setFlashMessage('The spritesheet you chose is missing a source and a key.', true);
        return false;
      }
      if (!data.spritesheet.width || !data.spritesheet.height) {
        MessageService.setFlashMessage('You need to specify the spritesheet\'s width and height.', true);
        return false;
      }
      // animations
      if (!data.moveFrames || data.moveFrames.length < 1 || !data.moveFps || !data.attackFrames || data.attackFrames.length < 1 || !data.attackFps) {
        MessageService.setFlashMessage('You need to fill out all the animation information for the enemy spritesheet.', true);
        return false;
      }
      // attack pattern
      if (!data.attackPattern) {
        MessageService.setFlashMessage('You need to specify an attack pattern.', true);
        return false;
      }

      return true;
    }

    ////////////////////////////
    // EDITOR DEF AND METHODS //
    ////////////////////////////
    var editor;
    function loadEditor() {
      editor = new Phaser.Game(1000, 500, Phaser.CANVAS, 'phaser-frame', { preload: preload, create: create, update: update, render: render });


      /* EDITOR VARS */
      var tiles;
      var scrollSpeed = -75;
      var player;
      var enemyGroup;
      var enemyTimer = 0;

      function preload() {
        // background tiles
        editor.load.image('floor', 'assets/editor_floor.png');

        // load debris/dust sprites
        editor.load.spritesheet('death', '../api/uploads/explode.png', 50, 50);

        // load all saved assets
        AssetService.preloadAllAssets(editor);
      }

      function create() {
        // allow timing for debug output
        editor.time.advancedTiming = true;

        // lay tiles
        tiles = editor.add.tileSprite(0, 0, editor.width, editor.height, 'floor');

        // create player bullet pool
        editor.allPlayerBullets = editor.add.group();

        // create death sprites
        editor.deathAnimations = editor.add.group();
        for (var i = 0; i < 10; i++) {
          var deathSpr = editor.add.sprite(0, 0, 'death');
          deathSpr.animations.add('die');
          deathSpr.anchor.setTo(0.5, 0.5);
          deathSpr.kill();
          editor.deathAnimations.add(deathSpr);
        }
        editor.physics.enable(editor.deathAnimations, Phaser.Physics.ARCADE);

        // create player sprite
        player = new PlayerService.Player(editor, 50, editor.world.centerY, angular.copy(playerData), true);

        // create enemy bullet pool
        editor.allEnemyBullets = editor.add.group();

        // create enemy sprite group
        enemyGroup = editor.add.group();
      }

      function update() {
        // scroll bg
        tiles.autoScroll(scrollSpeed, 0);

        // generate enemies
        enemyTimer++;
        if (enemyTimer % $scope.spawnTimer === 0) {
          spawnEnemy();
        }

        var i;
        var subgroup;
        // enemy/player-bullet collision handling 
        for (i = 0; i < editor.allPlayerBullets.children.length; i++) {
          subgroup = editor.allPlayerBullets.children[i];
          editor.physics.arcade.overlap(enemyGroup, subgroup, hitCharacterHandler, hitCharacterProcess);
        }

        // player/enemy-bullet collision handling
        for (i = 0; i < editor.allEnemyBullets.children.length; i++) {
          subgroup = editor.allEnemyBullets.children[i];
          editor.physics.arcade.overlap(player, subgroup, hitCharacterHandler, hitCharacterProcess);
        }

        // player/enemy collision handling
        editor.physics.arcade.overlap(player, enemyGroup, hitPlayerHandler, hitCharacterProcess);
      }

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
        var enemy = new EnemyService.Enemy(
          editor, // game
          editor.width, // x
          Math.floor(Math.random() * 350) + 50, // y
          angular.copy($scope.enemyData), // data
          player // target sprite
        );
        enemyGroup.add(enemy);
      }

      function render() {
        if ($scope.showDebug) {
          editor.debug.text(editor.time.fps + ' fps', editor.width - 64, 20);
          editor.debug.text('--PLAYER--', 10, 20);
          editor.debug.spriteInfo(player, 10, 36); 
          // editor.debug.spriteInfo(enemy, 10, editor.height - 75);
        }
      }
    }
  }
]);
