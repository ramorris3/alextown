app.controller('EnemyController',
  ['$http', '$scope', 'FileReader', 'EnemyService', 'PlayerService', 'SaveService', 
  function($http, $scope, FileReader, EnemyService, PlayerService, SaveService) {

    //////////////////
    // INITIAL VARS //
    //////////////////

    $scope.moveOptions = [
      {
        name: 'Default',
        func: function(enemySprite, playerSprite) {
          enemySprite.animations.play('run');
          console.log('x: ' + enemySprite.x + ', y: ' + enemySprite.y);

          enemySprite.body.velocity.x = -enemySprite.moveSpeed;
        }
      },
      {
        name: 'Follow',
        func: function(enemySprite, playerSprite) {
          enemySprite.animations.play('run');

          // get distance to playerSprite
          var distance = enemySprite.game.math.distance(enemySprite.x, enemySprite.y, playerSprite.x, playerSprite.y);
          // if more than 4px away, follow
          if (distance > 4) {
            // Calculate the angle to the target
            var rotation = enemySprite.game.math.angleBetween(enemySprite.x, enemySprite.y, playerSprite.x, playerSprite.y);
            // set velocity vector based on rotation and speed
            enemySprite.body.velocity.setTo(
                Math.cos(rotation) * enemySprite.moveSpeed,
                Math.sin(rotation) * enemySprite.moveSpeed
            );
          } else {
            enemySprite.body.velocity.x = -enemySprite.moveSpeed;
          }
        }
      }
    ];

    $scope.enemyData = {
      name: 'Grumpus',
      description: 'Enter enemy description or tagline here.',
      stats: {
        health: 3,
        moveSpeed: 200,
        damage: 1
      },
      sprites: {
        src: 'api/uploads/grumpus.png',
        moveSprite: {
          height: 36,
          width: 24,
          frames: [0,1,2,3,4,5],
          fps: 10
        }
      },
      move: $scope.moveOptions[1].func
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
