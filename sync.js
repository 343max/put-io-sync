var PutIO = require('put.io-v2');
var argv = require( 'argv' );
var _ = require('underscore');
var fs = require('fs');
var execSync = require('execSync');
var Pushover = require('node-pushover');
var TVShowMatcher = require('./tvshowdir');
var config = require('./config');

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

function listDir(directoryId, localPath, callback) {
  fs.mkdir(localPath, 0766, function dirCreated() {
    api.files.list(directoryId, function gotPutIoListing(data) {
      _.each(data.files, function eachFile(fileNode) {
        var localFilePath = localPath + '/' + fileNode.name;

        if (fileNode.content_type == 'application/x-directory') {
          listDir(fileNode.id, localFilePath);
        } else {
          var fileDir = localPath;
          var tvshow = matcher(fileNode.name);

          if (tvshow) fileDir = tvshow.path;

          var finalPath = fileDir + '/' + fileNode.name;

          fs.stat(localFilePath, function gotFileStat(err, stat) {
            if (stat) return;
            var shellCommand = config.ariaPath + ' -d "' + fileDir + '" "' + api.files.download(fileNode.id) + '"';

            console.log('downloading ' + localFilePath + '...');
            console.log(shellCommand);
            var result = execSync.stdout(shellCommand);

            if (fileNode.size > 20 * 1024 * 1024) {
              if (tvshow) {
                push.send('put.io sync', 'downloaded an episode of ' + tvshow.name);
              } else {
                push.send('put.io sync', 'Downloaded ' + fileNode.name);
              }
            }
          });
        }
      });
    });
  });
}

listDir(directoryId, localPath);
