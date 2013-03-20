var PutIO = require('put.io-v2');

var api = new PutIO('CI0698O7');

api.files.list(0, function(data) {
  console.dir(data);
});