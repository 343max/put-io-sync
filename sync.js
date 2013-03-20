var PutIO = require('put.io-v2');
var argv = require( 'argv' );
var _ = require('underscore');
var fs = require('fs');

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
            console.dir([err, stat]);
            console.dir(fileNode);
            console.dir(api.files.download(fileNode.id));

            var shellCommand = aria2cPath + ' --dir="' + localPath + '" ' + api.files.download(fileNode.id);
            console.log(shellCommand);
          });
        }
      });
    });
  });
}

listDir(directoryId, localPath);