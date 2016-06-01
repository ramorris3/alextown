app.controller('EnemyController',
  ['$http', '$scope', 'DamageService', 'FileReader', 'EnemyService', 'PlayerService', 'SaveService', 
  function($http, $scope, DamageService, FileReader, EnemyService, PlayerService, SaveService) {

    ////////////////
    // MODEL VARS //
    ////////////////
    $scope.showDebug = false; // shows fps and sprite/stat info
    $scope.spawnTimer = 120; // frames between each enemy spawn
    /*
      Enemy data and options are $scope properties,
      because they are accessible and mutable via UI
    */
    $scope.moveOptions = [
      'Default',
      'Follow'
    ];

    $scope.bulletOptions = [
      {
        name: 'Blue',
        key: 'blue-bullet',
        src: 'api/uploads/blue-bullet.png'
      },
      {
        name: 'Red',
        key: 'red-bullet',
        src: 'api/uploads/red-bullet.png'
      }
    ];

    $scope.enemyAttackOptions = [
      {
        key: 'Charge',
        cooldown: 250, // num frames
        chargeSpeed: 800, // px per frame
        duration: 30, // num frames
        range: 300
      },
      {
        key: 'Ranged',
        cooldown: 60, // num frames
        bullet: $scope.bulletOptions[1],
        bulletSpeed: 350 // px per second
      }
    ];

    // used for sprite initialization
    $scope.enemyData = {
      // General
      name: 'Morio', // NAME MUST BE UNIQUE
      description: 'every game needs a morio',
      // stats
      health: 10,
      damage: 1,
      // movement
      moveSpeed: 200,
      movePattern: $scope.moveOptions[0],
      // Assets (preload)
      // main sheet contains move, attack, and damaged animations
      spritesheet: {
        key: 'morio',
        src: 'api/uploads/morio.png',
        width: 50,
        height: 50
      },
      // animations
      moveFrames: [0,1],
      moveFps: 10,
      attackFrames: [2,3],
      attackFps: 10,
      // attack patterns
      attackPattern: $scope.enemyAttackOptions[1]
    };

    /*
      Player assets and data objects are local vars
      because they will not be manipulated by the UI,
      they will be loaded by PlayerService
    */

    // used for sprite initialization
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
        key: 'stairfex',
        src: 'api/uploads/stairfex.png',
        width: 50,
        height: 50
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
        bullet: $scope.bulletOptions[0],
        bulletSpeed: 700 // px per second
      }
    };

    ////////////////////////////
    // EDITOR DEF AND METHODS //
    ////////////////////////////

    var editor = new Phaser.Game(1000, 500, Phaser.CANVAS, 'enemy-frame', { preload: preload, create: create, update: update, render: render });


    /* EDITOR VARS */
    var tiles;
    var scrollSpeed = -75;
    var player;
    var enemyGroup;
    var enemyTimer = 0;

    function preload() {
      // background tiles
      editor.load.image('floor', 'assets/editor_floor.png');

      // preload bullets
      editor.load.image('blue-bullet', 'api/uploads/blue-bullet.png');
      editor.load.image('red-bullet', 'api/uploads/red-bullet.png');

      // load debris/dust sprites
      editor.load.spritesheet('death', 'api/uploads/explode.png', 50, 50);

      // player
      editor.load.spritesheet(playerData.spritesheet.key, playerData.spritesheet.src, playerData.spritesheet.width, playerData.spritesheet.height);

      // enemy
      editor.load.spritesheet($scope.enemyData.spritesheet.key, $scope.enemyData.spritesheet.src, $scope.enemyData.spritesheet.width, $scope.enemyData.spritesheet.height);
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
        editor.physics.arcade.collide(enemyGroup, subgroup, hitCharacterHandler, hitCharacterProcess);
      }

      // player/enemy-bullet collision handling
      for (i = 0; i < editor.allEnemyBullets.children.length; i++) {
        subgroup = editor.allEnemyBullets.children[i];
        editor.physics.arcade.collide(player, subgroup, hitCharacterHandler, hitCharacterProcess);
      }
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


    //////////////////
    // VIEW METHODS //
    //////////////////

    // loads a preview of the sprite file before saving
    $scope.getFile = function() {
      $scope.progress = 0;
      FileReader.readAsDataUrl($scope.file, $scope)
        .then(function(result) {
          $scope.previewSrc = $scope.enemyData.img = result;
        });
    };

    // saves the enemy
    $scope.saveEnemy = function() {
      // send enemyobject to EnemyService to save
      console.log($scope.enemyData.img);
      SaveService.saveEnemy($scope.enemyData, function(data) {
        $scope.enemyData.imgSrc = data.src;
        $scope.src = data.src;
        reloadEditorState();
      });
    };

    // cancels the save
    $scope.cancelSave = function() {
      var really = confirm('Are you sure you want to cancel?  Settings will revert to their default state.');
      if (really) {
        resetToDefault();
      }
    };


    //////////////////////////
    // OTHER HELPER METHODS //
    //////////////////////////

    $scope.reloadEditorState = function() {
      editor.state.start(editor.state.current);
    };

  }
])

.directive('ngFileSelect', function() {
  return {
    link: function($scope, el) {
      el.bind('change', function(e){
        $scope.file = (e.srcElement || e.target).files[0];
        $scope.getFile();
      });
    }
  };
});
