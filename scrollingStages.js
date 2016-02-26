/** Generates a stage of scrolling tiles, and returns ONLY tiles which have physics enabled. **/

alexTown.makeCastleStage = function(game) {
    // return var: objects which will require collision checking outside of this function
    var physicalTiles = game.add.group();

    // init constants
    this.GROUND_TILE_SIZE = 48;
    this.RUG_TILE_WIDTH = 192;
    this.RUG_TILE_HEIGHT = 312;
    this.SCROLL_SPEED = -75; // < 0 means scroll left

    // physics init function
    function initPhysics(tile, game) {
        game.physics.enable(tile);
        tile.body.immovable = true;
        tile.body.allowGravity = false;
    };

    // set stage background to stone color
    game.stage.backgroundColor = 0x444444;

    // set scrolling rug on ground
    for (var x = 0; x < game.width; x += this.RUG_TILE_WIDTH) {
        // add a rug tile
        var rugTile = game.add.tileSprite(x,
            (game.height/2) - (this.RUG_TILE_HEIGHT/2) + (this.GROUND_TILE_SIZE/4),
            this.RUG_TILE_WIDTH,
            this.RUG_TILE_HEIGHT,
            'rug'
        );
        rugTile.autoScroll(this.SCROLL_SPEED, 0); // x, y
    }

    // set scrolling walls and ceiling
    for (var x = 0; x < game.width; x += this.GROUND_TILE_SIZE) {
        // add a ceiling tile
        var ceilTile = game.add.tileSprite(x, 0,
            this.GROUND_TILE_SIZE,
            this.GROUND_TILE_SIZE,
            'ground'
        );
        ceilTile.autoScroll(this.SCROLL_SPEED, 0);

        // add a wall tile
        var wallTile = game.add.tileSprite(x,
            game.height - (this.GROUND_TILE_SIZE/2),
            this.GROUND_TILE_SIZE,
            this.GROUND_TILE_SIZE,
            'ground'
        );
        wallTile.autoScroll(this.SCROLL_SPEED, 0);
        wallTile.bringToTop(); // bring to foreground

        // set up physics for wall and ceiling, and add to return group
        initPhysics(ceilTile, game);
        initPhysics(wallTile, game);

        ceilTile.body.setSize(this.GROUND_TILE_SIZE,
            this.GROUND_TILE_SIZE/2, 0, 0);

        physicalTiles.add(ceilTile);
        physicalTiles.add(wallTile);
    }

    //return any objects that will require collision checking
    return physicalTiles;
};

/* We can use this file for stage gen for future levels as well */