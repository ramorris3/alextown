var app = angular.module('EditorApp', [])

.controller('MainController', 
  ['$http', '$scope',
    function($http, $scope) {
      /* EDITOR DEF */
      var editor = new Phaser.Game(1000, 500, Phaser.CANVAS, '', {preload: preload, create: create, update: update}); 

      /* CORE EDITOR FUNCTIONS (GUI) */
      function preload() {
        editor.load.image('highlight', '../assets/highlight.png');
        editor.load.image('cursor', '../assets/cursor.png');
        editor.load.spritesheet('chomper', '../assets/chomper_2.png', 24, 36);
      }

      var highlight;
      var cursor;
      var grid = [];
      var tileSize = 50;
      var prevMouseDown = false;
      var controlKey;
      var saveKey;
      var prevSaveDown = false;
      var filename;
      var level;

      function create() {
        // init grid
        for (i = 0; i < editor.width; i += tileSize) {
          var list = [];
          for (j = 0; j < editor.height; j += tileSize) {
            list.push('0');
          }
          grid.push(list);
        }

        // init GUI elements
        highlight = editor.add.sprite(0, 0, 'highlight');
        cursor = editor.add.sprite(editor.world.centerX, editor.world.centerY, 'cursor');

        // init hotkey controls
        controlKey = editor.input.keyboard.addKey(Phaser.Keyboard.CONTROL);
        saveKey = editor.input.keyboard.addKey(Phaser.Keyboard.S);
      }

      function update() {
        // update mouse cursor position
        cursor.x = editor.input.mousePointer.x;
        cursor.y = editor.input.mousePointer.y;
        // update gridLocation of the highlight
        updateHighlight();

        // check if the player released the mouse click button
        if (editor.input.activePointer.isDown) {
          prevMouseDown = true;
        }
        else if (prevMouseDown) { // mouse was down but is not anymore
          prevMouseDown = false;
          placeCreature();
        }

        // check if user is saving the level (Ctrl + S is pressed)
        if (saveKey.isDown) {
          if (!prevSaveDown && controlKey.isDown) {
            save();
          }
          prevSaveDown = true;
        } else {
          prevSaveDown = false;
        }
      }

      /* HELPER METHODS */
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
        // keep highlight on screen
        if (highlight.x <= 0) highlight.x = 0;
        if (highlight.x + highlight.width >= editor.width) {
          highlight.x = editor.width - highlight.width;
        }
        if (highlight.y <= 0) highlight.y = 0;
        if (highlight.y + highlight.height >= editor.height) {
          highlight.y = editor.height - highlight.height;
        }
      }

      // places a creature at the current highlight gridloc
      function placeCreature() {
        gridLoc = getGridLocation(highlight.x, highlight.y);
        if (grid[gridLoc.x][gridLoc.y] === '0') {
          // place chomper on grid model
          grid[gridLoc.x][gridLoc.y] = 'Z';

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

      // saves the grid to a .json file - evoked by Ctrl + S
      function save () {
        // get filename and level number
        if (!filename) {
          filename = prompt('What do you want to name the file? (Exclude file extension.)');
          filename = filename.replace(/\W/g, '');
          filename += '.json';
          // don't save if no filename given
          if (!filename) {
            alert('File was not saved.');
            return;
          }
          level = prompt('What level will this be (int)?');
          // don't save if level is invalid
          if (level === NaN || level === null) {
            alert('Must enter integer for level number.  File not saved.');
            return;
          }
        }

        // request to server to save the level data
        $http.post('../api/save', { "filename": filename, "level": level, "data": grid })
          .success(function(data) {
            console.log('got data' + JSON.stringify(data, null, 2));
            alert('File was successfully saved: public/stages/' + filename);
          })
          .error(function(data) {
            console.log('ERROR: ' + data);
            alert('There was a problem saving the file.');
          });
      }


  }
]);