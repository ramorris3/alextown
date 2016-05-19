app.controller('EnemyController',
  ['$http', '$scope', 'EnemyService', 'FileReader',
  function($http, $scope, EnemyService, FileReader) {

    $scope.enemyData = {};
    $scope.enemy = {};

    // NEED A SAVE BUTTON
    // when you save, the image will go to the DB
    // Then, you'll restart the canvas
    // preload will then make an API request for the image.
    // (NEED AN API ROUTE FOR THAT PART)

    /* EDITOR DEF */
    var editor = new Phaser.Game(1000, 500, Phaser.CANVAS, 'enemy-frame', {preload: preload, create: create, update: update});

    function preload() {
      editor.load.image('floor', 'assets/editor_floor.png');
      if ($scope.enemyData.pic) {
        editor.load.image('floor', $scope.enemyData.pic);
      }
    }

    function create() {
      editor.add.tileSprite(0, 0, editor.width, editor.height, 'floor');
      if ($scope.enemyData.pic) {
        $scope.enemy = editor.add.sprite(0, 0, $scope.enemyData.pic);
      }
    }

    function update() {
      /* nothing yet */
    }

    /* VIEW METHODS */
    $scope.getFile = function() {
      $scope.progress = 0;
      FileReader.readAsDataUrl($scope.file, $scope)
        .then(function(result) {
          $scope.previewSrc = result;
        });
    };

    $scope.saveEnemy = function() {

      // send enemyobject to EnemyService to save
      $scope.enemyData.pic = result;
      reloadState();
    }

    function reloadState() {
      editor.state.start(editor.state.current);
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