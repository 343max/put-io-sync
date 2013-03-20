var PutIO = require('put.io-v2');

var api = new PutIO('CI0698O7');
var argv = require( 'argv' );

var args = argv.option([{
  name: 'directory-id',
  short: 'd',
  type: 'int',
  description: 'id of the directory to sync'
}]).run();

var directoryId = args.options['directory-id'] || 0;

//console.dir(args);
console.dir(directoryId);
//

function listDir(directoryId) {
  api.files.list(directoryId, function(data) {
    console.dir(data.files);
  });
}

listDir(directoryId);