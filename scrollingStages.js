/** Generates a stage of scrolling tiles, and returns ONLY tiles which have physics enabled. **/

alexTown.makeCastleStage = function(game) {
    // return var: objects which will require collision checking outside of this function
    var physicalTiles = game.add.group();

    // init constants
    this.GROUND_TILE_SIZE = 48;
    this.RUG_TILE_WIDTH = 192;
    this.RUG_TILE_HEIGHT = 312;

    // set the default tile update function (scrolling)
    var scrollTile = function(tile) {
        return function() {
            tile.tilePosition.x -= 1.3; // px per frame
        };
    };

    // set stage background to stone color
    game.stage.backgroundColor = 0x444444;

    // set scrolling rug on ground
    for (var x = 0; x < game.width; x += this.RUG_TILE_WIDTH) {
        // add a rug tile
        var rugTile = game.add.tileSprite(x,
            (game.height / 2) - (this.RUG_TILE_HEIGHT / 2),
            this.RUG_TILE_WIDTH,
            this.RUG_TILE_HEIGHT,
            'rug'
        );
        rugTile.update = scrollTile(rugTile);
    }

    // set scrolling walls and ceiling
    for (var x = 0; x < game.width; x += this.GROUND_TILE_SIZE) {
        // add a ceiling tile
        var ceilTile = game.add.tileSprite(x, 0,
            this.GROUND_TILE_SIZE,
            this.GROUND_TILE_SIZE,
            'ground'
        );
        ceilTile.update = scrollTile(ceilTile);
        //physics only necessary for ceiling tile
        game.physics.enable(ceilTile);
        ceilTile.body.setSize(this.GROUND_TILE_SIZE,
            this.GROUND_TILE_SIZE/2, 0, 0);
        ceilTile.body.immovable = true;
        ceilTile.body.allowGravity = false;
        physicalTiles.add(ceilTile);

        // add a wall tile
        var wallTile = game.add.tileSprite(x,
            game.height - (this.GROUND_TILE_SIZE/2),
            this.GROUND_TILE_SIZE,
            this.GROUND_TILE_SIZE,
            'ground'
        );
        wallTile.update = scrollTile(wallTile);

    }

    //return any objects that will require collision checking
    return physicalTiles;
};

/* We can use this file for stage gen for future levels as well */