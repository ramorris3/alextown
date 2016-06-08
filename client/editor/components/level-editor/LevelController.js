app.controller('LevelController', 
  ['$http', '$scope', 'AssetService', 'EnemyService', 'LevelService', 'MessageService',
  function($http, $scope, AssetService, EnemyService, LevelService, MessageService) {

    // init message
    MessageService.setFlashMessage('Choose an enemy from the "Enemies" dropdown to get started.', false);

    ///////////////////////////
    // VIEW VARS AND METHODS //
    ///////////////////////////

    var self = this;
    $scope.levelData = {};
      //title
      //description
      //number
      //background (assetData)
    $scope.levelNumbers = [1,2,3,4,5,6,7,8,9,10];
    $scope.getBackgrounds = AssetService.getBackgrounds;
    $scope.getAllEnemies = EnemyService.getAllEnemies;
    $scope.currentEnemy = {};

    function validData() {
      var message;
      if (!$scope.levelData.title || !$scope.levelData.description) {
        message = 'You must enter a title and description for the level.';
      } else if (!$scope.levelData.number) {
        message = 'You need to choose a number for the level.';
      } else if (!$scope.levelData.background) {
        message = 'You need to choose a background tile for the level.';
      } else if (!$scope.levelData.enemies || $scope.levelData.enemies.length < 1) {
        message = 'Enemy grid data is corrupt';
      } else {
        return true;
      }
      if (message) {
        MessageService.setFlashMessage(message, true);
        return false;
      }
    }

    // saves the levelData to a .json file
    $scope.saveLevel = function() {
      if (validData()) {
        var levelData = angular.copy($scope.levelData);
        LevelService.saveLevel(levelData);
      }
    };

    $scope.loadLevel = function() {
      var num = $scope.levelData.number;
      $scope.levelData = LevelService.getLevel(num);
      $scope.reloadEditorState();
    };


    //////////////////////////////
    // EDITOR DEF AND FUNCTIONS //
    //////////////////////////////

    var editor = new Phaser.Game(1000, 500, Phaser.CANVAS, 'phaser-frame', {preload: preload, create: create, update: update, render: render}); 

    function preload() {
      // default background
      if (!$scope.levelData.background) {
        editor.load.image('floor', 'assets/editor_floor.png');
      }

      // GUI elements
      editor.load.image('highlight', 'assets/highlight.png');
      editor.load.image('cursor', 'assets/cursor.png');
      editor.load.image('stageRight', 'assets/stage_right.png');
      editor.load.image('stageLeft', 'assets/stage_left.png');
      editor.load.bitmapFont('carrier_command', 'assets/carrier_command.png', 'assets/carrier_command.xml');

      // spritesheets
      AssetService.preloadAllAssets(editor);
    }

    // editor vars
    var highlight;
    var cursor;
    var stageRight;
    var stageLeft;
    $scope.levelData.enemies = [];
    var tileSize = 50;
    var prevMouseDown = false;
    var filename;
    var level;
    var viewFrame = 0;
    var maxFrames = 20;
    var frameText;
    var layers;

    function create() {

      // rendering layers: sprites drawn in the order of layers object properties
      layers = {
        background: editor.add.group(),
        enemies: editor.add.group(),
        ui: editor.add.group()
      };

      // init world
      editor.world.setBounds(0, 0, editor.width * maxFrames, editor.height);
      // background (default if none selected)
      var key = $scope.levelData.background ? $scope.levelData.background.key : 'floor';
      var bg = editor.add.tileSprite(0, 0, editor.width * maxFrames, editor.height, key);
      layers.background.add(bg);

      // init grid
      initGrid();

      // init GUI elements
      highlight = editor.add.sprite(0, 0, 'highlight');
      stageLeft = editor.add.sprite(8, editor.world.centerY - 16, 'stageLeft');
      stageRight = editor.add.sprite(editor.width - 40, editor.world.centerY - 16, 'stageRight');
      cursor = editor.add.sprite(editor.world.centerX, editor.world.centerY, 'cursor');

      // enable physics
      editor.physics.enable(cursor, Phaser.Physics.ARCADE);
      editor.physics.enable(stageRight, Phaser.Physics.ARCADE);
      editor.physics.enable(stageLeft, Phaser.Physics.ARCADE);

      // set bounding box for cursor
      cursor.body.setSize(8, 8);

      // fix GUI to camera
      stageLeft.fixedToCamera = true;
      stageRight.fixedToCamera = true;
      cursor.fixedToCamera = true;

      // add GUI elements to respective rendering layers
      layers.background.add(highlight);
      layers.ui.add(stageLeft);
      layers.ui.add(stageRight);
      layers.ui.add(cursor);

      // init HUD text
      frameText = editor.add.bitmapText(10, 10, 'carrier_command', 'FRAME: ' + (viewFrame + 1).toString() + '/' + maxFrames, 20);
      frameText.fixedToCamera = true;

    }

    function update() {

      // update the camera position
      if (editor.camera.x < viewFrame * editor.width) {
        editor.camera.x += 20;
      } else if (editor.camera.x > viewFrame * editor.width) {
        editor.camera.x -= 20;
      }

      // update mouse cursor position
      cursor.cameraOffset.x = editor.input.mousePointer.x;
      cursor.cameraOffset.y = editor.input.mousePointer.y;

      // update gridLocation and visibility of grid highlight
      updateHighlight();

      // update the GUI sprites and functionality based on hover
      // default
      cursor.clickAction = function() {
        placeCreature();
      };

      // if done scrolling, show highlight again
      if (!highlight.alive && editor.camera.x == viewFrame * editor.width) {
        highlight.revive();
      }

      // hovering over right-arrow
      editor.physics.arcade.overlap(cursor, stageRight, function() {
        highlight.kill(); // hide highlight
        cursor.clickAction = function() {
          scrollRight();
        };
      });

      // hovering over left-arrow
      editor.physics.arcade.overlap(cursor, stageLeft, function() {
        highlight.kill(); // hide highlight
        cursor.clickAction = function() {
          scrollLeft();
        };
      });

      // check if the player released the mouse click button
      if (editor.input.activePointer.isDown) {
        prevMouseDown = true;
      }
      else if (prevMouseDown) { // mouse was down but is not anymore
        prevMouseDown = false;
        cursor.clickAction();
      }

    }

    function render() {
      //editor.debug.body(cursor);
    }

    ///////////////////////////
    // EDITOR HELPER METHODS //
    ///////////////////////////

    function getGridLocation(cartX, cartY) {
      return {
        x: Math.floor(cartX / tileSize),
        y: Math.floor(cartY / tileSize)
      };
    }

    // moves the highlight to the gridlocation where mouse is
    function updateHighlight() {
      hGridLoc = getGridLocation(highlight.x, highlight.y);
      cGridLoc = getGridLocation(cursor.x, cursor.y);
      if (hGridLoc.x != cGridLoc.x || hGridLoc.y != cGridLoc.y) {
        highlight.x = cGridLoc.x * tileSize;
        highlight.y = cGridLoc.y * tileSize;
      }

      // keep highlight in view
      if (highlight.x < editor.camera.x) {
        highlight.x = editor.camera.x;
      } else if (highlight.x > editor.camera.x + editor.camera.width - tileSize) {
        highlight.x = editor.camera.x + editor.camera.width - tileSize;
      }
      if (highlight.y < 0) { // camera only moves horizontally
        highlight.y = 0;
      } else if (highlight.y > editor.height - tileSize) {
        highlight.y = editor.height - tileSize;
      }
    }

    // places a creature at the current highlight gridloc
    function placeCreature() {
      if (!highlight.alive || !$scope.currentEnemy.spritesheet) return;
      gridLoc = getGridLocation(highlight.x, highlight.y);
      if ($scope.levelData.enemies[gridLoc.x][gridLoc.y] === '0') {
        // place creature on grid model
        $scope.levelData.enemies[gridLoc.x][gridLoc.y] = $scope.currentEnemy.name;

        // place creature on GUI
        var creature = editor.add.sprite(0, 0, $scope.currentEnemy.spritesheet.key);

        // center creature on tile
        creature.anchor.setTo(0.5);
        creature.x = (gridLoc.x * tileSize) + (tileSize / 2);
        creature.y = (gridLoc.y * tileSize) + (tileSize / 2);

        // add to rendering layer
        layers.enemies.add(creature);

        // play creature animation
        var moveFrames = $scope.currentEnemy.moveFrames.split(',');
        for (i = 0; i < moveFrames.length; i++) {
          moveFrames[i] = parseInt(moveFrames[i], 10);
        }
        creature.animations.add('move', moveFrames, $scope.currentEnemy.moveFps, true);
        creature.animations.play('move');
      }
    }

    function scrollRight() {
      viewFrame++;
      if (viewFrame > maxFrames - 1) {
        viewFrame = maxFrames - 1;
      }
      frameText.text = 'FRAME: ' + (viewFrame + 1).toString() + '/' + maxFrames;
    }
    function scrollLeft() {
      viewFrame--;
      if (viewFrame < 0) {
        viewFrame = 0;
      }
      frameText.text = 'FRAME: ' + (viewFrame + 1).toString() + '/' + maxFrames;
    }

    //////////////////////////
    // OTHER HELPER METHODS //
    //////////////////////////

    function initGrid() {
      var i, j;

      // empty grid
      if ($scope.levelData.enemies.length < 1) {
        for (i = 0; i < editor.width * maxFrames; i += tileSize) {
          var list = [];
          for (j = 0; j < editor.height; j += tileSize) {
            list.push('0');
          }
          $scope.levelData.enemies.push(list);
        }
        return;
      }

      // state reloaded, place existing enemies on grid
      for (i = 0; i < $scope.levelData.enemies.length; i++) {
        for (j = 0; j < $scope.levelData.enemies[i].length; j++) {
          if ($scope.levelData.enemies[i][j] !== '0') {
            var currentEnemy = $scope.getAllEnemies()[$scope.levelData.enemies[i][j]];
            // place creature on GUI
            var creature = editor.add.sprite(0, 0, currentEnemy.spritesheet.key);
            // add to rendering layer
            layers.enemies.add(creature);
            // center creature
            creature.anchor.setTo(0.5);
            creature.x = (i * tileSize) + (tileSize / 2);
            creature.y = (j * tileSize) + (tileSize / 2);
            // play creature animation
            var moveFrames = currentEnemy.moveFrames.split(",");
            for (var k = 0; k < moveFrames.length; k++) {
               moveFrames[k] = parseInt(moveFrames[k], 10);
            }
            creature.animations.add('move', moveFrames, currentEnemy.moveFps, true);
            creature.animations.play('move');
          }
        }
      }
    }

    $scope.reloadEditorState = function() {
      editor.state.start(editor.state.current);
    };

    // clear the level
    $scope.reset = function() {
      $scope.levelData.enemies = [];
      initGrid();
      editor.state.start(editor.state.current);
    };

  }
]);