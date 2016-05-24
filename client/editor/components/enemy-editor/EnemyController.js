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

    $scope.attackOptions = [
      {
        key: 'MELEE',
        name: 'Charge (melee)',
        duration: 120 // num frames
      },
      {
        key: 'RANGED',
        name: 'Fire (ranged)',
        cooldown: 60, // num frames
        bullet: [
          'api/uploads/red-bullet.png',
          'api/uploads/blue-bullet.png'
        ],
        bulletSpeed: 350 // px per second
      }
    ];

    $scope.enemyData = {
      // General
      name: 'Morio',
      description: 'every gam need a morio',
      // stats
      health: 3,
      damage: 1,
      // movement
      moveSpeed: 200,
      movePattern: $scope.moveOptions[0];
      // animations
      mainSprite: 'api/uploads/morio.png', // main sheet contains move, attack, and damaged animations
      mainSpriteHeight: 50,
      mainSpriteWidth: 50,
      moveFrames: [0,1],
      moveFps: 10,
      attackFrames: [2,3],
      attackFps: 10,
      damageFrames: [4,5],
      damageFps: 10,
      deathSprite: 'api/uploads/explode.png', // death sheet contains only death animation
      deathSpriteHeight: 50,
      deathSpriteWidth: 50,
      // attack patterns
      attackPattern: $scope.attackOptions[1]
    };

    $scope.playerData = {
      stats: {
        health: 5,
        moveSpeed: 300,
        damage: 1
      },
      sprites: {
        src: 'api/uploads/hydra_run.png',
        moveSprite: {
          height: 32,
          width: 32,
          frames: [0,1,2,3],
          fps: 10
        }
      }
    };


    ////////////////////////////
    // EDITOR DEF AND METHODS //
    ////////////////////////////

    var editor = new Phaser.Game(1000, 500, Phaser.CANVAS, 'enemy-frame', {preload: preload, create: create, update: update});


    /* EDITOR VARS */
    var tiles;
    var scrollSpeed = -75;
    var player = PlayerService.createPlayerFromData($scope.playerData, editor);
    var enemy = EnemyService.createEnemyFromData($scope.enemyData, editor, true);

    function preload() {
      // background tiles
      editor.load.image('floor', 'assets/editor_floor.png');

      // player
      player.preload();
      // load enemy assets
      enemy.preload();
    }

    function create() {
      // lay tiles
      tiles = editor.add.tileSprite(0, 0, editor.width, editor.height, 'floor');

      // create player sprite
      player.create(50, editor.world.centerY); // x, y

      // create enemy sprite at given positions (y is between 100 and 400)
      enemy.create(editor.width, Math.floor(Math.random() * (400 - 50 + 1)) + 50);
    }

    function update() {
      // scroll bg
      tiles.autoScroll(scrollSpeed, 0);

      // update player
      player.update();

      // update enemy state
      enemy.update(player.sprite);
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
      enemy = EnemyService.createEnemyFromData($scope.enemyData, editor, true);
      editor.state.start(editor.state.current);
    };

    function resetToDefault() {
      $scope.enemyData = {
        preloaded: false
      };
      reloadEditorState();
    }

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
