var gm = require('gm')
  , path = require('path')
  , fs = require('fs')
  , async = require('async')
  , mkdirp = require('mkdirp')
  , rimraf = require('rimraf')
  ;

var Nailer = module.exports = function Nailer (opts) {
  opts = opts || {};
  this.w = opts.w || 200;
  this.h = opts.h || 200;
  this.q = opts.q || 90;
  this.thumbDir = opts.thumbDir || '/tmp';
  this.prefix = opts.prefix || '';
}

//
// Create a thumbnail if it doesn't exist or if the modified time
// of the thumbnail is older than the modified time of the original image
// callback will be invokes with three parameters:
//
// * error
// * thumbPath - path to the thumbnail
// * created - was the thumbnail just created
//
Nailer.prototype.create = function(filePath, cb) {
  if (!cb || typeof cb !== 'function') cb = function noop(){};
  var self = this;
  var basename = path.dirname(filePath);
  var thumbRel = basename.substring(self.prefix.length);
  var thumbDir = path.join(self.thumbDir, thumbRel);
  var thumbPath = path.resolve(thumbDir, path.basename(filePath));

  mkdirp(thumbDir, function (err) {
    if (err) return cb(err);

    // stat the original image and the thumbnail if it exists to check if
    // the thumbnail needs to be updated
    fs.stat(filePath, function (err, origStat) {
      if (err) return cb(err);

      fs.stat(thumbPath, function (err, thumbStat) {
        var needToGenThumbnail = (err || !thumbStat || origStat.mtime > thumbStat.mtime);
        if (needToGenThumbnail) {
          gm(filePath).thumb(self.w, self.h, thumbPath, self.q, function (err) {
            cb(err, thumbPath, true);
          });
        }
        else {
          cb(null, thumbPath, false);
        }
      });
    });
  });
};

Nailer.prototype.del = function(filePath, cb) {
  if (!cb || typeof cb !== 'function') cb = function noop(){};
  var self = this;
  var basename = path.dirname(filePath);
  var thumbRel = basename.substring(self.prefix.length);
  var thumbDir = path.join(self.thumbDir, thumbRel);
  var thumbPath = path.resolve(thumbDir, path.basename(filePath));

  // rm -rf should take care of directories and thumbnails and be
  // fault tolerant
  rimraf(thumbPath, cb);
};
