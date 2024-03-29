var gm = require('gm')
  , path = require('path')
  , mkdirp = require('mkdirp')
  , async = require('async')
  , watch = require('watch')
  , peekDirectory = require('./peekDirectory')
  , Nailer = require('./Nailer')
  ;

var ThumbnailManager = module.exports = function (opts) {
  var dir = this.dir = path.resolve(process.cwd, (opts.dir || ''));
  var baseThumbDir = this.thumbDir = opts.thumbDir || '/tmp';
  var smThumbDir = path.join(baseThumbDir, 'sm');
  var lgThumbDir = path.join(baseThumbDir, 'lg');
  var smNailer = new Nailer({ thumbDir: smThumbDir, prefix: dir, h: 200, w: 200 });
  var lgNailer = new Nailer({ thumbDir: lgThumbDir, prefix: dir, h: 800 });


  var handleDirectory = function handleDirectory(dir) {
    //console.log(dir);
    peekDirectory(dir, function (err, result) {
      if (err) throw err;

      result.forEach(function (item) {
        if (item.isImage) {
          thumbnailQueue.push({ action: 'create', path: item.path });
        }
        else if (item.isDirectory) {
          handleDirectory(item.path);
        }
      });
    });
  }

  var thumbnailQueue = async.queue(function (task, cb) {
    var f = task.path, action = task.action;

    if (action === 'create') {
      smNailer.create(f, function (err, thumbPath, created){
        if (err) {
          console.error(err);
          return cb();
        }

        if (created) console.log('created thumbnail', thumbPath);

        lgNailer.create(f, function (err, thumbPath, created){
          if (err) {
            console.error(err);
            return cb();
          }

          if (created) console.log('created thumbnail', thumbPath);
          //else console.log('skipped', thumbPath)
          cb();
        });

      });
    }
    else if (action === 'delete') {
      smNailer.del(f, function (err) {
        if (err) console.error(err)
        lgNailer.del(f, function (err) {
          if (err) console.error(err)
            cb();
        });
      });
    }
  }, 5);

  //
  // TODO fix: file system events seem to be called twice everytime :-/
  //
  watch.createMonitor(dir, {
      ignoreDotFiles: true,
      filter: isDirOrImage
    }, function (monitor) {
    monitor.on("created", function (f, stat) {
      //console.log('created', f, stat.isFile(), stat.isDirectory())
      if (stat.isFile() && isImage(f)) thumbnailQueue.push({ action: 'create', path: f });
      else if (stat.isDirectory) handleDirectory(f);
    })
    monitor.on("changed", function (f, curr, prev) {
      //console.log('changed', f, curr.isFile(), curr.isDirectory())
      if (stat.isFile() && isImage(f)) thumbnailQueue.push({ action: 'create', path: f });
      else if (stat.isDirectory) handleDirectory(f);
    })
    monitor.on("removed", function (f, stat) {
      //console.log('removed', f, stat.isFile(), stat.isDirectory())
      thumbnailQueue.push({ action: 'delete', path: f });
    })
  });

  handleDirectory(dir);

}



function isDirOrImage(f, stat) {
  return !(stat.isDirectory() || isImage(f));
}

function isImage(f) {
  return (/\.(gif|jpg|jpeg|tiff|png)$/i).test(f);
}



// thumbnailQueue.drain = function() {
//   console.log('all items have been processed');
// }


