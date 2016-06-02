app.controller('LevelController', 
  ['$http', '$scope', 'SaveService',
  function($http, $scope, SaveService) {

    //////////////////
    // INITIAL VARS //
    //////////////////

    var self = this;

    $scope.enemies = [
      {
        name: 'Chomper',
        description: 'Can\'t deal damage, but they slow on contact.'
      },
      {
        name: 'Charger',
        description: 'Temperamental enemies who will charge when in range.'
      },
      {
        name: 'Rook',
        description: 'Sharpshooters who deal damage from a distance.'
      }
    ];

    $scope.currentEnemy = $scope.enemies[0];


    //////////////////////////////
    // EDITOR DEF AND FUNCTIONS //
    //////////////////////////////

    var editor = new Phaser.Game(1000, 500, Phaser.CANVAS, 'phaser-frame', {preload: preload, create: create, update: update}); 

    function preload() {
      // background
      editor.load.image('floor', 'assets/editor_floor.png');

      // GUI elements
      editor.load.image('highlight', 'assets/highlight.png');
      editor.load.image('cursor', 'assets/cursor.png');
      editor.load.image('stageRight', 'assets/stage_right.png');
      editor.load.image('stageLeft', 'assets/stage_left.png');
      editor.load.bitmapFont('carrier_command', 'assets/carrier_command.png', 'assets/carrier_command.xml');

      // enemies
      editor.load.spritesheet('chomper', 'assets/chomper_2.png', 24, 36);
    }

    // editor vars
    var highlight;
    var cursor;
    var stageRight;
    var stageLeft;
    self.grid = [];
    var tileSize = 50;
    var prevMouseDown = false;
    var filename;
    var level;
    var viewFrame = 0;
    var maxFrames = 20;
    var frameText;

    function create() {
      // init world
      editor.world.setBounds(0, 0, editor.width * maxFrames, editor.height);
      editor.add.tileSprite(0, 0, editor.width * maxFrames, editor.height, 'floor');

      // init grid
      for (i = 0; i < editor.width * maxFrames; i += tileSize) {
        var list = [];
        for (j = 0; j < editor.height; j += tileSize) {
          list.push('0');
        }
        self.grid.push(list);
      }

      // init GUI elements
      highlight = editor.add.sprite(0, 0, 'highlight');
      stageLeft = editor.add.sprite(8, editor.world.centerY - 16, 'stageLeft');
      stageRight = editor.add.sprite(editor.width - 40, editor.world.centerY - 16, 'stageRight');
      cursor = editor.add.sprite(editor.world.centerX, editor.world.centerY, 'cursor');
      stageLeft.fixedToCamera = true;
      stageRight.fixedToCamera = true;
      cursor.fixedToCamera = true;

      editor.physics.enable(cursor, Phaser.Physics.ARCADE);
      editor.physics.enable(stageRight, Phaser.Physics.ARCADE);
      editor.physics.enable(stageLeft, Phaser.Physics.ARCADE);

      // init HUD text
      frameText = editor.add.bitmapText(10, 10, 'carrier_command', 'FRAME: ' + viewFrame + '/' + maxFrames, 20);
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
      if (!highlight.alive) return;
      gridLoc = getGridLocation(highlight.x, highlight.y);
      if (self.grid[gridLoc.x][gridLoc.y] === '0') {
        // place chomper on grid model
        self.grid[gridLoc.x][gridLoc.y] = 'Z';

        // place chomper on GUI at center of highlight
        var creature = editor.add.sprite(gridLoc.x * tileSize, gridLoc.y * tileSize, 'chomper');
        // center chomper
        creature.x = (gridLoc.x * tileSize) + (highlight.width / 2) - (creature.width / 2);
        creature.y = (gridLoc.y * tileSize) + (highlight.height / 2) - (creature.height / 2);
        // play chomper animation
        creature.animations.add('chomp', [0,1,2,3,4,5], 10, true);
        creature.animations.play('chomp');
      }
    }

    function scrollRight() {
      viewFrame++;
      if (viewFrame > maxFrames) {
        viewFrame = maxFrames;
      }
      frameText.text = 'FRAME: ' + viewFrame + '/' + maxFrames;
    }
    function scrollLeft() {
      viewFrame--;
      if (viewFrame < 0) {
        viewFrame = 0;
      }
      frameText.text = 'FRAME: ' + viewFrame + '/' + maxFrames;
    }


    //////////////////
    // VIEW METHODS //
    //////////////////

    // saves the grid to a .json file
    $scope.saveLevel = function() {
      // get filename and level number
      if (!filename) {
        filename = prompt('What do you want to name the file? (Exclude file extension.)');

        // don't save if no filename given
        if (!filename) {
          alert('File was not saved.');
          return;
        }

        filename = filename.replace(/\W/g, '');
        if (filename === '') {
          alert('You must include at least one alphanumeric character in the filename.  File was not saved.');
          return;
        }

        filename += '.json';
        level = prompt('What level will this be (int)?');
        // don't save if level is invalid
        if (isNaN(level) || level === null) {
          alert('Must enter integer for level number.  File not saved.');
          return;
        }
      }

      // save the level
      SaveService.saveLevel(filename, level, self.grid);
    };

    $scope.cancelSave = function() {
      var really = confirm('Are you sure you want to cancel?  The level will reset to a default empty level.');
      if (really) {

      }
    };

    //////////////////////////
    // OTHER HELPER METHODS //
    //////////////////////////

    function initGrid() {
      for (i = 0; i < editor.width * maxFrames; i += tileSize) {
        var list = [];
        for (j = 0; j < editor.height; j += tileSize) {
          list.push('0');
        }
        self.grid.push(list);
      }
    }

    function reloadEditorState() {
      editor.state.start(editor.state.current);
    }

    function resetLevel() {
      initGrid();
      reloadEditorState();
    }

  }
]);