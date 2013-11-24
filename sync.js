var PutIO = require('put.io-v2');
var argv = require( 'argv' );
var _ = require('underscore');
var fs = require('fs');
var Pushover = require('node-pushover');
var request = require('request');
var TVShowMatcher = require('./tvshowdir');
var Aria2 = require('./aria2');
var config = require('./config');
require('longjohn');

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
var aria = new Aria2(config.aria2c.bin, config.aria2c.args);

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

function checkLocalFile(localFilename, callback) {
  fs.stat(localFilename, function(err, stat) {
    fs.stat(localFilename + '.aria2', function(ariaErr, ariaStat) {
      var downloadIsInProgress = (ariaStat != null);
      var downloadIsCompleted = (!downloadIsInProgress && (stat != null));

      callback(downloadIsInProgress, downloadIsCompleted);
    });
  });
}

function sendRPCRequest(methodName, params) {
  if (!params) params = [];

  request.post({
      url: 'http://' + config.aria2c.rpcHost + '/jsonrpc',
      json: {
        "jsonrpc":"2.0",
        "method":methodName,
        "params": params,
        "id":"1",
        "timeout": 5000
      }
    }, function(error, response, body) {
      if (error && error.code == 'ECONNREFUSED') {
        console.error('connection refused to aria2c rpc at ' + config.aria2c.rpcHost);
        console.error('could it be you forgot to start aria2c --enable-rpc ?');
      }

      if (body && body.error) {
        console.error('aria2c response: ' + body.error.message);
      }
    }
  );
}

function WaitFor() {
  var self = this;
  var counters = {}
  this.whenComplete = function() { console.log('complete'); };

  var count = function(label, i) {
    var c = counters[label] || 0;
    c += i;
    if (c < 0)
      throw ('count below 0 for label ' + label);
    counters[label] = c;

    var sum = _.reduce(counters, function(memo, value) {
      return memo + value;
    }, 0);

    if (sum == 0) {
      self.whenComplete();
    }
  }

  this.up = function(label) {
    count(label, 1);
  };

  this.down = function(label) {
    count(label, -1);
  }
}

var waiting = new WaitFor();

function listDir(directoryId, localPath, isChildDir) {
  waiting.up('listDir');
  api.files.list(directoryId, function gotPutIoListing(data) {
    if (data.files.length == 0) {
      if (isChildDir) {
        console.log('deleting empty directory from put.io');
        api.files.delete(directoryId);
      }
    } else {
      waiting.up('mkdir');
      fs.mkdir(localPath, 0755, function dirCreated() {
        _.each(data.files, function eachFile(fileNode) {
          waiting.up('eachFile');
          var localFilePath = localPath + '/' + fileNode.name;

          if (fileNode.content_type == 'application/x-directory') {
            listDir(fileNode.id, localFilePath, true);
            waiting.down('eachFile');
          } else {
            var fileDir = localPath;
            var tvshow = matcher(fileNode.name);

            if (tvshow) fileDir = tvshow.path;

            var finalPath = fileDir + '/' + fileNode.name;
            var downloadURL = api.files.download(fileNode.id);

            checkLocalFile(finalPath, function(downloadIsInProgress, downloadIsCompleted) {
              if (downloadIsCompleted) {
                console.log('should delete ' + JSON.stringify(fileNode.name));
                // api.files.delete(fileNode.id);
              } else if (downloadIsInProgress) {
                console.log('download in progress: ' + fileNode.name);
              } else {
                aria.addUri(downloadURL, finalPath, null, { fileNode: fileNode, tvshow: tvshow } );

                console.log('downloading ' + localFilePath + '...');
              }
              waiting.down('eachFile');
            });
          }
        });
        waiting.down('mkdir');
      });
    }
    waiting.down('listDir');
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

  waiting.whenComplete = function() {
    aria.exec(function(complete, incomplete) {
      var pushoverMessages = [];

      _.each(complete, function(download) {
        var fileNode = download.associatedObject.fileNode;
        var tvshow = download.associatedObject.tvshow;
        if (tvshow) {
          pushoverMessages.push('episode of ' + tvshow.name);
        } else {
          pushoverMessages.push(fileNode.name);
        }

        console.log('deleting file ' + fileNode.id + ' (' + fileNode.name + ')');
        // api.files.delete(fileNode.id);
      });

      if (pushoverMessages.length > 0) {
        push.send('put.io sync', 'Downloaded: \n' + pushoverMessages.join(", "));
      }
    });
  };
}

