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

// TODO refactor, encapsulation blown
var smThumbDir = path.join(thumbDir, 'sm');
var lgThumbDir = path.join(thumbDir, 'lg');

var thumbnailManager = new ThumbnailManager({
  dir: dir,
  thumbDir: thumbDir
});

//
// Express setup
//
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.static(path.join(__dirname, 'public')));
app.use(app.router);

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/api/directory/*', function (req, res, next) {
  var dirPath = path.join(smThumbDir, req.params[0]);
  peekDirectory(dirPath, function (err, dirResults) {
     if (err) return res.send(err);

     // need to strip out prefix from each file path to return just
     // a relative path. If it ends in a '/', account for that
     var prefixLength = smThumbDir.length;
     if (smThumbDir[prefixLength-1] !== '/') prefixLength++;

     dirResults = dirResults.map(function (i) { i.path = i.path.substring(prefixLength); return i; })
     res.send(dirResults);
  });
});

app.get('/api/sm/*', function (req, res, next) {
  var filePath = path.join(smThumbDir, req.params[0]);
  var fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);
  if (!res.getHeader('Cache-Control')) 
    res.setHeader('Cache-Control', 'public, max-age=120');
  fileStream.on('error', function (err) {
    res.send(err);
  })
});

app.get('/api/lg/*', function (req, res, next) {
  var filePath = path.join(lgThumbDir, req.params[0]);
  var fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);
  if (!res.getHeader('Cache-Control')) 
    res.setHeader('Cache-Control', 'public, max-age=120');
  fileStream.on('error', function (err) {
    res.send(err);
  })
});

app.get('/api/file/*', function (req, res, next) {
  var filePath = path.join(lgThumbDir, req.params[0]);
  var fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);
  fileStream.on('error', function (err) {
    res.send(err);
  })
});

app.get('/api/exif/*', function (req, res, next) {
  var filePath = path.join(dir, req.params[0]);

  exif(filePath, function(err, obj){
    if (err) return res.send(err);
    res.send(obj);
  })
});

app.get('/*', function (req, res) {
  res.render('index')
})

app.listen(PORT, function () {
  console.log('listening on port %s', PORT)
});