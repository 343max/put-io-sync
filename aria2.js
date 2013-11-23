var _ = require('underscore');
var spawn = require('child_process').spawn;

module.exports = function Aria2(command, args) {
  var self = this;
  var downloadQueue = [];
  var gidIndex = 0;

  if (!args)
    args = [];

  args.push('-i -');

  this.gid = function() {
    var pad = '0000000042000000';
    return (pad + (gidIndex++)).slice(-pad.length);
  }

  this.addUri = function addDownload(urls, localpath, options) {
    var gid = this.gid();
    if (!options) options = {};
    options.gid = gid;

    if (localpath) {
      var pathElements = localpath.split('/');
      options.out = pathElements.pop();
      options.dir = pathElements.join('/');
    }

    if (typeof urls === "string")
      urls = [ urls ];

    downloadQueue.push({
      urls: urls,
      localpath: localpath,
      options: options
    });

    return gid;
  }

  this.inputFileEntry = function inputFileEntry(download) {
    var result = download.urls.join(' ') + "\n";

    _.each(download.options, function(value, key) {
      result += "  " + key + "=" + value + "\n";
    });

    return result;
  };

  this.inputFile = function inputFile() {
    var result = ''
    _.each(downloadQueue, function(download) {
      result += self.inputFileEntry(download);
    });

    return result;
  }

  this.exec = function(exec) {
    var ariaProcess = spawn(command, args);
    ariaProcess.stdout.on('data', function(data) {
      console.log(data.toString());
    });
    ariaProcess.on('error', function(err) {
      console.dir(err);
    });
    ariaProcess.on('close', function(code) {
      console.log('process existed with: ' + code);
    });
    ariaProcess.stdin.end(this.inputFile());
    return ariaProcess;
  }
}