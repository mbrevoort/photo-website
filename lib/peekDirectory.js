var async = require('async')
  , path = require('path')
  , fs = require('fs')
  ;

module.exports = function peekDirectory (dir, cb) {
  if (!cb || typeof cb !== 'function') cb = function noop(){};

  fs.readdir(dir, function (err, files) {
    if (err) return cb(err);

    // filter out any files that start with a dot
    files = files.filter(fileFilter)

    // prepend the absolute path
    files = files.map(function (f) { return path.resolve(dir, f); });

    async.map(files, fs.stat, function(err, results){
      if (err) return cb(err);
      var dirResults = [];
      for (var i=0; i<files.length; i++) {
        dirResults[i] = {
          path: files[i],
          isDirectory: results[i].isDirectory(),
          isImage: isImage(files[i]),
          isMovie: isMovie(files[i])
        }
      }
      cb(null, dirResults);
    });
  });
}

function isImage(f) {
  return (/\.(gif|jpg|jpeg|tiff|png)$/i).test(f);
}

function isMovie(f) {
  return (/\.(mov|mpg|wmv)$/i).test(f);
}

function fileFilter(f) {
  return f.indexOf('.') !== 0 && f.indexOf('.!sync') < 0;
}