var PutIO = require('put.io-v2');
var argv = require( 'argv' );
var _ = require('underscore');
var fs = require('fs');

var api = new PutIO('CI0698O7');

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

  fs.mkdir(localPath, 0766, function() {
    api.files.list(directoryId, function(data) {
      _.each(data.files, function(node) {
        console.dir(node);

        if (node.content_type == 'application/x-directory') {
          listDir(node.id, localPath + '/' + node.name);
        }
      });
    });
  });
}

listDir(directoryId, localPath);