var PutIO = require('put.io-v2');
var argv = require( 'argv' );
var _ = require('underscore');
var fs = require('fs');
var Pushover = require('node-pushover');
var TVShowMatcher = require('./tvshowdir');
var config = require('./config');
var spawn = require('child_process').spawn;


var push = null;
if (config.pushpin.enabled) {
  push = new Pushover({
    token: config.pushpin.appkey,
    user: config.pushpin.userkey
  });
} else {
  push = {
    send: function() {}
  };
}

var api = new PutIO(config.putIo.oauth2key);

var args = argv.option([{
  name: 'directory-id',
  short: 'd',
  type: 'int',
  description: 'id of the directory to sync'
}, {
  name: 'local-path',
  short: 'l',
  type: 'path',
  description: 'local dir to sync to'
}, {
  name: 'tvshow-dir',
  short: 's',
  type: 'path',
  description: '(optional) local filepath of your TV show dir'
}]).run();

var directoryId = args.options['directory-id'] || 0;
var localPath = args.options['local-path'];
var tvShowDir = args.options['tvshow-dir'];
var matcher = null;
if (tvShowDir) {
  matcher = TVShowMatcher(tvShowDir);
} else {
  matcher = function() {};
}

function downloadFiles(files) {
  var file_nodes = files;
  var file = file_nodes.pop();
  if (file) {
    var fileDir = localPath;
    var tvshow = matcher(file.name);

    if (tvshow) fileDir = tvshow.path;

    var finalPath = fileDir + '/' + file.name;

    fs.stat(finalPath, function gotFileStat(err, stat) {
              if (stat && stat.size == file.size) {
                // this file was allready downloaded - so we might delete it
                console.log('deleting ' + file.name + ' from put.io');
                api.files.delete(file.id);
                if (file_nodes > 0) {
                  downloadFiles(file_nodes);
                }
              };
              var shellCommand = config.ariaPath + ' --file-allocation=none --continue=true -d "' + fileDir + '" "' + api.files.download(file.id) + '"';
              var localFilePath = localPath + '/' + file.name;
              console.log('downloading ' + localFilePath + '...');
              console.log(shellCommand);
              var obj = spawn('bash', ['-c', shellCommand], { stdio: 'inherit' });

              obj.on('exit',function(code,signal) {
                       var afterStat = fs.statSync(finalPath);
                       deleteShowIfCompleted(api, file, afterStat);
                       downloadFiles(file_nodes);
                       if (file.size > 20 * 1024 * 1024) {
                         if (tvshow) {
                           push.send('put.io sync', 'downloaded an episode of ' + tvshow.name);
                         } else {
                           push.send('put.io sync', 'Downloaded ' + file.name);
                         }
                       }
                     });
            });
  }
}

function deleteShowIfCompleted(api, fileNode, stat) {
  if (stat && stat.size == fileNode.size) {
    // this file was allready downloaded - so we might delete it
    console.log('deleting ' + fileNode.name + ' from put.io');
    api.files.delete(fileNode.id);
    return true;
  };

  return false;
}

function listDir(directoryId, localPath, isChildDir) {
  api.files.list(directoryId, function gotPutIoListing(data) {
    if (data.files.length == 0) {
      if (isChildDir) {
        console.log('deleting empty directory from put.io');
        api.files.delete(directoryId);
      }
    } else {
      fs.mkdir(localPath, 0766, function dirCreated() {
        var files = [];
        _.each(data.files, function eachFile(fileNode) {
          if (fileNode.content_type == 'application/x-directory') {
            listDir(fileNode.id, localPath, true);
          } else {
            files.push(fileNode);
          }
        });
        downloadFiles(files);
      });
    }
  });
}

var lockFile = '/tmp/putiosync-' + directoryId + '.lock';

if (fs.existsSync(lockFile)) {
  console.log('Process already running. If it is not the delete ' + lockFile);
} else {
  process.on('exit', function() {
    fs.unlinkSync(lockFile);
  });
  fs.open(lockFile, 'w', 0666, function(err, fd) {
    fs.closeSync(fd);
  });
  listDir(directoryId, localPath, false);

}
