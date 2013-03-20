var PutIO = require('put.io-v2');
var argv = require( 'argv' );
var _ = require('underscore');
var fs = require('fs');
var execSync = require('execSync');
var queue = require('queue-async');

var q = queue(1);


var api = new PutIO('CI0698O7');
var aria2cPath = 'aria2c';

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

//console.dir(args);
console.dir(directoryId);
//

function listDir(directoryId, localPath) {
  console.log(localPath);

  fs.mkdir(localPath, 0766, function dirCreated() {
    api.files.list(directoryId, function gotPutIoListing(data) {
      _.each(data.files, function eachFile(fileNode) {
        var localFilePath = localPath + '/' + fileNode.name;

//        console.dir(fileNode);

        if (fileNode.content_type == 'application/x-directory') {
          listDir(fileNode.id, localFilePath);
        } else {
          fs.stat(localFilePath, function gotFileStat(err, stat) {
            if (stat) return;

            var shellCommand = aria2cPath + ' -d "' + localPath + '" "' + api.files.download(fileNode.id) + '"';
            console.log(shellCommand);

            q.defer(function() {
              console.log('Starting download of ' + localFilePath);
              var result = execSync.stdout(shellCommand);
              console.log('Finished download of ' + localFilePath);
            });
          });
        }
      });
    });
  });
}

listDir(directoryId, localPath);
q.awaitAll(function(error, results) {
  console.log('done!');
})