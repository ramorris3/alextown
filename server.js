// Server definition
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var fs = require('fs'); // for writing to files

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

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

// API endpoints
var router = express.Router(); 

router.get('/test', function(req, res) {
  res.send('<p>Hooray!  API is working!</p>\
    <style>body, html {padding: 20px;text-align: center; font-family: sans-serif; font-weight: 300; font-size: 48px;}</style>');
});

router.post('/save/stage', function(req, res) {
  // get the filepath
  var filepath = 'stages/' + req.body.filename;
  console.log('saving to ' + filepath + '...');
  // create an object to save at "filepath"
  var levelData = {};
  levelData.level = req.body.level;
  levelData.data = req.body.data;
  console.log('levelData:\n' + JSON.stringify(levelData, null, 2));
  // write the levelData to the file
  fs.writeFile(filepath, JSON.stringify(levelData, null, 2), function(err) {
      if(err) {
          console.log('ERROR' + err);
          res.status(500).send({message: 'ERROR: ' + err});
      }
      console.log('File was saved successfully!');
      res.status(200).send({message: 'File was saved'});
  }); 
});

app.use('/api', router);

// Run server
app.listen(port, function() {
  console.log('app listening on port ' + port + '...');
});