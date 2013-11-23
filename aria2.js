var _ = require('underscore');

module.exports = function Aria2(binPath) {
  var self = this;
  var downloadQueue = [];
  var gidIndex = 0;

  this.gid = function() {
    var pad = '00000000420000000';
    return (pad + (gidIndex++)).slice(-pad.length);
  }

  this.addUri = function addDownload(urls, localpath, options) {
    var gid = this.gid();
    if (!options) options = {};
    options.gid = gid;

    if (localpath) {
      var pathElements = localpath.split('/');
      options.name = pathElements.pop();
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
}