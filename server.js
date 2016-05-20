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

// get cmd line arguments
var port;
if (process.argv[2]) {
  if (process.argv[2] === 'editor') {
    app.use(express.static('client/editor'));
    port = 2000;
  }
} else {
  app.use(express.static('client/game'));
  port = 3000;
}

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

/* POST an image to the local server directory "uploads" */
router.post('/save/img', function(req, res) {

  // get base64 encoded image data
  var imgBuffer = decodeBase64Image(req.body.img);
  console.log(imgBuffer);

  // get filepath
  var filename = guid() + '.png';
  var filepath = path.join(__dirname,'uploads/',filename);
  console.log('Writing image to ' + filepath + '...')

  // write to file
  fs.writeFile(filepath, imgBuffer.data, function(err) {
      if(err) {
        console.log(err);
        res.status(500).send({message: 'There was a problem saving the image file.'});
      }
      console.log('\nImage was successfully saved!\n');
      var apiSrc = 'api/uploads/' + filename;
      res.status(200).send({message: 'Your enemy was successfully saved to the database!', src: apiSrc});
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

app.use('/api', router);

//////////////////////
// HELPER FUNCTIONS //
//////////////////////

/*
  Creates a unique GUID for filenames, id's, etc.
  code credit: http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
*/
function guid() {
  var S4 = function() {
    return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
  };
  return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
}

/*
  Image processing function
  code credit: http://stackoverflow.com/questions/20267939/nodejs-write-base64-image-file 
*/
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

app.listen(port, function() {
  console.log('app listening on port ' + port + '...');
});
