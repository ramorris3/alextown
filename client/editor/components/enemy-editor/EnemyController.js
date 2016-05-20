app.controller('EnemyController',
  ['$http', '$scope', 'FileReader', 'SaveService', 
  function($http, $scope, FileReader, SaveService) {

    //////////////////
    // INITIAL VARS //
    //////////////////

    $scope.enemyData = {
      imgSrc: null
    };


    ////////////////////////////
    // EDITOR DEF AND METHODS //
    ////////////////////////////

    var editor = new Phaser.Game(1000, 500, Phaser.CANVAS, 'enemy-frame', {preload: preload, create: create, update: update});

    function preload() {
      editor.load.image('floor', 'assets/editor_floor.png');

      if ($scope.enemyData.imgSrc) {
        editor.load.image('enemy', $scope.enemyData.imgSrc);
        $scope.enemyData.preloaded = true;
      }
    }

    /////////////////
    // EDITOR VARS //
    /////////////////

    var enemy;

    function create() {
      // lay tiles
      editor.add.tileSprite(0, 0, editor.width, editor.height, 'floor');

      // init enemy if one has been uploaded
      if ($scope.enemyData.preloaded) {
        enemy = editor.add.sprite(editor.world.centerX, editor.world.centerY, 'enemy');
        enemy.xSpeed = 3;
        enemy.ySpeed = 3;
      }
    }

    function update() {
      if (enemy) {
        // move enemy
        enemy.x += enemy.xSpeed;
        enemy.y += enemy.ySpeed;

        // keep enemy inside editor
        if (enemy.x < 0) {
          enemy.xSpeed *= -1;
          enemy.x = 0;
        } else if (enemy.x > editor.width - enemy.width) {
          enemy.xSpeed *= -1;
          enemy.x = editor.width - enemy.width;
        }

        if (enemy.y < 0) {
          enemy.ySpeed *= -1;
          enemy.y = 0;
        } else if (enemy.y > editor.height - enemy.height) {
          enemy.ySpeed *= -1;
          enemy.y = editor.height - enemy.height;
        }
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

    function reloadEditorState() {
      $scope.enemyData.preloaded = false;
      enemy = null;
      editor.state.start(editor.state.current);
    }

    function resetToDefault() {
      $scope.enemyData = {
        preloaded: false
      };
      reloadEditorState();
    }

  }
])

/* 
  Directive for file uploads
  Credit: http://plnkr.co/edit/y5n16v?p=preview
*/
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
