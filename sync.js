var PutIO = require('put.io-v2');
var argv = require( 'argv' );
var _ = require('underscore');
var fs = require('fs');
var execSync = require('execSync');
var config = require('./config');

console.dir(config);

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
  description: 'local filepath to sync to'
}]).run();

var directoryId = args.options['directory-id'] || 0;
var localPath = args.options['local-path'];

function listDir(directoryId, localPath, callback) {
  fs.mkdir(localPath, 0766, function dirCreated() {
    api.files.list(directoryId, function gotPutIoListing(data) {
      _.each(data.files, function eachFile(fileNode) {
        var localFilePath = localPath + '/' + fileNode.name;

        if (fileNode.content_type == 'application/x-directory') {
          listDir(fileNode.id, localFilePath);
        } else {
          fs.stat(localFilePath, function gotFileStat(err, stat) {
            if (stat) return;

            var shellCommand = config.ariaPath + ' -d "' + localPath + '" "' + api.files.download(fileNode.id) + '"';

            console.log('downloading ' + localPath + '...');
            console.log(shellCommand);
            var result = execSync.stdout(shellCommand);
          });
        }
      });
    });
  });
}

listDir(directoryId, localPath);
