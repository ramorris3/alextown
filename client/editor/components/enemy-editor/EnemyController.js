app.controller('EnemyController',
  ['$http', '$scope', 'SaveService',
  function($http, $scope, SaveService) {

    /* EDITOR DEF */
    var editor = new Phaser.Game(1000, 500, Phaser.CANVAS, 'enemy-frame', {preload: preload, create: create, update: update});

    function preload() {
      editor.load.image('floor', 'assets/editor_floor.png');
    }

    function create() {
      editor.add.tileSprite(0, 0, editor.width, editor.height, 'floor');
    }

    function update() {
      /* nothing yet */
    }

  }
]);