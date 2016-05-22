app.controller('EnemyController',
  ['$http', '$scope', 'FileReader', 'EnemyService', 'SaveService', 
  function($http, $scope, FileReader, EnemyService, SaveService) {

    //////////////////
    // INITIAL VARS //
    //////////////////

    $scope.moveOptions = [
      {
        name: 'Default',
        func: function(enemySprite, playerSprite) {
          enemySprite.body.velocity.x = -enemySprite.moveSpeed;
        }
      },
      {
        name: 'Follow',
        func: function(enemySprite, playerSprite) {
          // get distance to playerSprite
          var distance = enemySprite.game.math.distance(enemySprite.x, enemySprite.y, playerSprite.x, playerSprite.y);
          // if more than 200px away, follow
          if (distance > 200) {
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
        moveSprite: {
          src: 'api/uploads/skull-test.png'
          // height, width
        }
      },
      move: $scope.moveOptions[0].func
    };


    ////////////////////////////
    // EDITOR DEF AND METHODS //
    ////////////////////////////

    var editor = new Phaser.Game(1000, 500, Phaser.CANVAS, 'enemy-frame', {preload: preload, create: create, update: update});


    /* EDITOR VARS */
    var player;
    var enemy = EnemyService.createEnemyFromData($scope.enemyData, editor);

    function preload() {
      // background tiles
      editor.load.image('floor', 'assets/editor_floor.png');

      // player
      editor.load.image('player', 'api/uploads/smile.png');
      // load enemy assets
      enemy.preload();
    }

    function create() {
      // lay tiles
      editor.add.tileSprite(0, 0, editor.width, editor.height, 'floor');

      player = editor.add.sprite(50, editor.world.centerY, 'player');

      // create enemy sprite at given positions
      enemy.create(editor.width, editor.world.randomY);
    }

    function update() {
      // update enemy state
      enemy.update(player);
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
      enemy = EnemyService.createEnemyFromData($scope.enemyData, editor);
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
