app.controller('EnemyController',
  ['$http', '$scope', 'FileReader', 'EnemyService', 'PlayerService', 'SaveService', 
  function($http, $scope, FileReader, EnemyService, PlayerService, SaveService) {

    ////////////////
    // MODEL VARS //
    ////////////////

    $scope.moveOptions = [
      {
        key: 'DEFAULT',
        name: 'Default'
      },
      {
        key: 'FOLLOW',
        name: 'Follow'
      }
    ];

    $scope.bulletOptions = [
      {
        name: 'Blue',
        src: 'api/uploads/blue-bullet.png'
      },
      {
        name: 'Red',
        src: 'api/uploads/red-bullet.png'
      }
    ];

    $scope.attackOptions = [
      {
        key: 'MELEE',
        name: 'Charge (melee)',
        cooldown: 300, // num frames
        chargeSpeed: 500, // px per frame
        duration: 120 // num frames
      },
      {
        key: 'RANGED',
        name: 'Fire (ranged)',
        cooldown: 60, // num frames
        bullet: $scope.bulletOptions[1],
        bulletSpeed: 350 // px per second
      }
    ];

    // used for preload
    $scope.enemyAssets = {
      // mainsprite = move, attack, damaged
      main: {
        key: 'morio',
        src: 'api/uploads/morio.png',
        width: 50,
        height: 50
      },
      // deathsprite = death sequence: no collisions or logic
      death: {
        key: 'explode',
        src: 'api/uploads/explode.png',
        width: 50,
        height: 50
      }
    };

    // used for sprite initialization
    $scope.enemyData = {
      // General
      name: 'Morio',
      description: 'every game needs a morio',
      // stats
      health: 3,
      damage: 1,
      // movement
      moveSpeed: 200,
      movePattern: $scope.moveOptions[1],
      // animations
      mainSprite: $scope.enemyAssets.main.key, // main sheet contains move, attack, and damaged animations
      moveFrames: [0,1],
      moveFps: 10,
      attackFrames: [2,3],
      attackFps: 10,
      damageFrames: [4,5],
      damageFps: 10,
      deathSprite: $scope.enemyAssets.death.key, // death sheet contains only death animation
      deathFps: 10,
      // attack patterns
      attackPattern: $scope.attackOptions[1]
    };

    $scope.playerAssets = {
      main: {
        key: 'player',
        src: 'api/uploads/grumpus.png',
        width: 24,
        height: 36
      },
      death: {
        // later
      }
    };

    $scope.playerData = {
      // general
      name: 'Ghost Player',
      description: 'This is just a test',
      // stats
      health: 5,
      damage: 1,
      moveSpeed: 300,
      // animations
      mainSprite: $scope.playerAssets.main.key,
      moveFrames: [0,1,2,3,4,5],
      moveFps: 10
    };


    ////////////////////////////
    // EDITOR DEF AND METHODS //
    ////////////////////////////

    var editor = new Phaser.Game(1000, 500, Phaser.CANVAS, 'enemy-frame', { preload: preload, create: create, update: update, render: render });


    /* EDITOR VARS */
    var tiles;
    var scrollSpeed = -75;
    var player;
    var enemy;

    function preload() {
      // background tiles
      editor.load.image('floor', 'assets/editor_floor.png');

      // player
      var playerMain = $scope.playerAssets.main;
      editor.load.spritesheet(playerMain.key, playerMain.src, playerMain.width, playerMain.height);

      // load dynamic enemy assets
      var enemyMain = $scope.enemyAssets.main;
      var enemyDeath = $scope.enemyAssets.death;
      editor.load.spritesheet(enemyMain.key, enemyMain.src, enemyMain.width, enemyMain.height);
      editor.load.spritesheet(enemyDeath.key, enemyDeath.src, enemyDeath.width, enemyDeath.height);
    }

    function create() {
      // allow timing for debug output
      editor.time.advancedTiming = true;

      // lay tiles
      tiles = editor.add.tileSprite(0, 0, editor.width, editor.height, 'floor');

      // create player sprite
      player = new PlayerService.Player(editor, 50, editor.world.centerY, angular.copy($scope.playerData), true);

      // create enemy sprite
      var y = Math.floor(Math.random() * (400 - 50 + 1)) + 50;
      enemy = new EnemyService.Enemy(editor, editor.width, y, angular.copy($scope.enemyData), player, true); // game, x, y, data, playerSprite, testing
    }

    function update() {
      // scroll bg
      tiles.autoScroll(scrollSpeed, 0);

      // update player
      player.update();

      // update enemy state
    }

    function render() {
      editor.debug.text(editor.time.fps + ' fps', 36, 36); 
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
