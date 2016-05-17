// Server definition
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var fs = require('fs'); // for writing to files

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

// API endpoints
var router = express.Router(); 

router.get('/test', function(req, res) {
  res.send('<h1>Hooray!  API is working.</h1>');
});

router.post('/save', function(req, res) {
  // get the filepath
  var filepath = 'public/stages/' + req.body.filename;
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
var port = process.env.PORT || 2000;
app.listen(port, function() {
  console.log('app listening on port ' + port + '...');
});