///////////////////
// SERVER CONFIG //
///////////////////

var express = require('express');
var path = require('path');
var app = express();
var bodyParser = require('body-parser');
var fs = require('fs'); // for writing to files

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use('/editor', express.static('client/editor'));
app.use('/game', express.static('client/game'));

///////////////////
// API ENDPOINTS //
///////////////////

var router = express.Router(); 

/* function for testing API */
router.get('/test', function(req, res) {
  res.send('<p>Hooray!  API is working!</p>\
    <style>body, html {padding: 20px;text-align: center; font-family: sans-serif; font-weight: 300; font-size: 48px;}</style>');
});

/* POST a level.json file to the "stages" folder */
router.post('/save/stage', function(req, res) {

  // get the filepath
  var filepath = 'stages/' + req.body.filename;
  console.log('saving to ' + filepath + '...');
  // create an object to save at "filepath"
  var levelData = {};
  levelData.level = req.body.level;
  levelData.data = req.body.data;

  // write the levelData to the file
  fs.writeFile(filepath, JSON.stringify(levelData, null, 2), function(err) {
      if(err) {
          console.log(err);
          res.status(500).send({message: 'Well, shoot.  Something went wrong while trying to save the level.'});
      }
      console.log('\nFile was saved successfully!\n');
      res.status(200).send({message: 'Your level was saved successfully as ~/' + filepath});
  });

});

/* GET all levels from the "stages" folder */
router.get('/stages', function(req, res) {
  //get filepath
  var filepath = 'stages/test.json';

  fs.readFile(filepath, function(err, data) {
    if (err) {
      return res.status(500).send({message: 'There was a problem reading the level from stages.json'});
    }
    console.log('\nLevel data retrieved...\n');
    res.status(200).send({
      message: 'Successfully got level data!',
      levelData: JSON.parse(data)
    });
  });
})

/* POST an image to the local server directory "uploads" */
router.post('/save/img', function(req, res) {

  // get base64 encoded image data
  var imgBuffer = decodeBase64Image(req.body.img);
  console.log(imgBuffer);

  // get filepath
  var key = req.body.name + '-' + guid();
  var filename = key + '.png';
  var filepath = path.join(__dirname,'uploads/',filename);
  console.log('Writing image to ' + filepath + '...')

  // write to file
  fs.writeFile(filepath, imgBuffer.data, function(err) {
      if(err) {
        console.log(err);
        res.status(500).send({message: 'There was a problem saving the image file.'});
      }
      console.log('\nImage was successfully saved!\n');
      var apiSrc = '../api/uploads/' + filename;
      res.status(200).send({
        message: 'Your asset\'s image was successfully saved to the server!',
        src: apiSrc,
        key: key
      });
    });
});

/* GET an image from "uploads" */
router.get('/uploads/:filename', function(req, res) {

  //get filepath
  filepath = path.join(__dirname,'uploads/',req.params.filename);

  // read file
  console.log('Reading from file ' + filepath + '...');
  fs.readFile(filepath, 'base64',
    function(err, data) {
      if (err) {
        console.log(err);
        res.status(500).send({message: 'Oops!  Looks like there was a problem loading the image from the server.'});
      }

      // make a base64 buffer and write to res
      console.log('\nSuccess! Writing to HTTP response.\n');
      var img = new Buffer(data, 'base64');

      res.writeHead(200, {
       'Content-Type': 'image/png',
       'Content-Length': img.length
      });
      res.end(img);
    });
});

/* GET all asset objects from 'assets.json' file */
router.get('/assets', function(req,res) {

  // get filepath
  filepath = path.join(__dirname,'assets.json');

  // read file
  console.log('\nReading asset data from file ' + filepath + '...\n');
  fs.readFile(filepath,
    function(err, data) {
      if (err) {
        console.log(err);
        return res.status(500).send({message: 'There was a problem loading the existing asset data.'});
      }

      console.log('\nGot asset data.  Writing response...\n');
      // get subsection of assets, if requested
      var allAssets = JSON.parse(data);
      var type = req.query.type;
      console.log(type);
      console.log(allAssets[type]);
      if (type && allAssets[type]) {
        allAssets = allAssets[type];
      }

      res.status(200).send({message: 'Successfully got asset data.', allAssetData: allAssets});
    });

});

/* POST an asset reference to 'assets.json' file */
router.post('/save/asset', function(req,res) {
  // get new asset data
  var newAsset = req.body;

  // get filepath
  filepath = path.join(__dirname, 'assets.json');

  // read file
  console.log('\nReading asset data from file ' + filepath + '...\n');
  fs.readFile(filepath,
    function(err, data) {
      if (err) {
        console.log(err);
        return res.status(500).send({message: 'There was a problem loading existing asset data.'});
      }

      // write the new asset to the file
      console.log('\nGot asset data.  Writing new asset ref...\n');
      var assets = JSON.parse(data);
      if (typeof assets !== 'object') {
        console.log('\nERROR: \'assets\' is not valid JSON.\n');
        return res.status(500).send({message: 'Existing asset data is corrupt.  Asset not saved.'});
      }
      if (!assets[newAsset.type]) {
        assets[newAsset.type] = {};
      }
      assets[newAsset.type][newAsset.name] = newAsset;
      console.log(assets);

      console.log('\nNew asset added.  Writing to file ' + filepath + '...\n');
      fs.writeFile(filepath, JSON.stringify(assets, null, 2), function(err) {
        if (err) {
          console.log(err);
          return res.status(500).send({message: 'There was a problem writing your asset to the file.'});
        }

        console.log('\nAsset data successfully written to ' + filepath + '!\n');
        return res.status(200).send({message: 'Your asset was successfully saved to the database!', allAssetData: assets});
      });

    });

});

/* GET all players from the 'players.json' file */
router.get('/players', function(req, res) {
  var filepath = path.join(__dirname, 'players.json');
  console.log('\nRetrieving players from ' + filepath + '...\n');

  fs.readFile(filepath, function(err, data) {
    if (err) {
      console.log(err);
      return res.status(500).send({message: 'There was a problem retrieving exising player data.'});
    }

    console.log('\nGot player data!  Writing response...\n');
    res.status(200).send({message: 'Successfully got players.', allPlayerData: JSON.parse(data)});
  })
})

/* GET all enemies from the 'enemies.json' file */
router.get('/enemies', function(req, res) {
  var filepath = path.join(__dirname,'enemies.json');
  console.log('\nRetrieving enemies from ' + filepath + '...\n');

  fs.readFile(filepath, function(err, data) {
    if (err) {
      console.log(err);
      return res.status(500).send({message: 'There was a problem retrieving existing enemy data.'});
    }

    console.log('\nGot enemy data!  Writing response...\n');
    res.status(200).send({message: 'Successfully got enemies.', allEnemyData: JSON.parse(data)});
  });
});

/* POST an enemy to the local server file 'enemies' */
router.post('/save/enemies', function(req, res) {
  // get enemy data
  var newEnemy = req.body;
  console.log('\nSAVING ENEMY:\n');
  console.log(newEnemy);

  // get filepath
  var filepath = path.join(__dirname,'enemies.json');
  console.log('\nReading enemy data from ' + filepath + '...\n');

  // get existing enemyData
  fs.readFile(filepath, function(err, data) {
    if (err) {
      console.log(err);
      return res.status(500).send({message: 'There was a problem retrieving existing enemy data.'});
    }

    // add enemy to existing enemy data
    console.log('\nGot enemy data from ' + filepath + '...\n');
    var enemies = JSON.parse(data);
    if (typeof enemies !== 'object') {
      console.log('\nERROR: \'Enemies\' is not a JSON object.\n');
      return res.status(500).send({message: 'Existing enemy data is corrupt.  Enemy not saved.'});
    }
    enemies[newEnemy.name] = newEnemy;
    console.log(enemies);

    // write enemy data to file
    console.log('\nNew enemy added.  Writing to file ' + filepath + '...\n');
    fs.writeFile(filepath, JSON.stringify(enemies, null, 2), function(err) {
      if (err) {
        console.log(err);
        return res.status(500).send({message: 'There was a problem writing your enemy to the file.'});
      }

      console.log('\nEnemy data successfully written to ' + filepath + '!\n');
      return res.status(200).send({message: 'Your enemy was successfully saved to the database!', allEnemyData: enemies});
    });
  });
});

app.use('/api', router);


//////////////////////
// HELPER FUNCTIONS //
//////////////////////

function guid() {
  var S4 = function() {
    return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
  };
  return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
}

function decodeBase64Image(dataString) {
  var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
    response = {};

  if (matches.length !== 3) {
    return new Error('Invalid input string');
  }

  response.type = matches[1];
  response.data = new Buffer(matches[2], 'base64');

  return response;
}

////////////////
// RUN SERVER //
////////////////

var port = process.env.PORT || 2000;

app.listen(port, function() {
  console.log('app listening on port ' + port + '...');
});
