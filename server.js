var path = require('path')
  , fs = require('fs')
  , exif = require('exif2')
  , ThumbnailManager = require('./lib/ThumbnailManager')
  , peekDirectory = require('./lib/peekDirectory')
  , express = require('express')
  , app = express();
  ;

const PORT = process.env.PORT || 3000;
var dir = path.resolve(__dirname, (process.argv[2] || ''));
var thumbDir = path.resolve(__dirname, (process.argv[3] || ''));

var thumbnailManager = new ThumbnailManager({
  dir: dir,
  thumbDir: thumbDir
});

app.get('/api/directory/*', function (req, res, next) {
  var dirPath = path.join(thumbDir, req.params[0]);
  peekDirectory(dirPath, function (err, dirResults) {
     if (err) return res.send(err);

     // need to strip out prefix from each file path to return just
     // a relative path. If it ends in a '/', account for that
     var prefixLength = thumbDir.length;
     if (thumbDir[prefixLength-1] !== '/') prefixLength++;

     dirResults = dirResults.map(function (i) { i.path = i.path.substring(prefixLength); return i; })
     res.send(dirResults);
  });
});

app.get('/api/thumbnail/*', function (req, res, next) {
  var filePath = path.join(thumbDir, req.params[0]);
  var fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);
});

app.get('/api/file/*', function (req, res, next) {
  var filePath = path.join(dir, req.params[0]);
  var fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);
});

app.get('/api/exif/*', function (req, res, next) {
  var filePath = path.join(dir, req.params[0]);

  exif(filePath, function(err, obj){
    if (err) return res.send(err);
    res.send(obj);
  })
});

app.listen(PORT, function () {
  console.log('listening on port %s', PORT)
});