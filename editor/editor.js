/* EDITOR DEF */
var editor = new Phaser.Game(1000, 500, Phaser.CANVAS, '', {preload: preload, create: create, update: update}); 

/* CORE EDITOR FUNCTIONS */
function preload() {
  editor.load.image('highlight', 'assets/highlight.png');
  editor.load.image('cursor', 'assets/cursor.png');
}

var highlight;
var cursor;
var grid = [];
var tileSize = 50;

function create() {
  // init grid
  for (i = 0; i < editor.width; i += tileSize) {
    var list = [];
    for (j = 0; j < editor.height; j += tileSize) {
      list.push(0);
    }
    grid.push(list);
  }

  // init GUI elements
  highlight = editor.add.sprite(0, 0, 'highlight');
  cursor = editor.add.sprite(editor.world.centerX, editor.world.centerY, 'cursor');
}

function update() {
  // update mouse cursor position
  cursor.x = editor.input.mousePointer.x;
  cursor.y = editor.input.mousePointer.y;
  // update gridLocation of the highlight
  updateHighlight();
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
  if (highlight.y <= 0) highlight.y = 0;
}

