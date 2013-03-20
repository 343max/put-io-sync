var fs = require('fs');
var _ = require('underscore');

module.exports = function BestDir(path) {
  var dirs = fs.readdirSync(path);

  var cleanupName = function(name) {
    return name.toLowerCase().replace(/[^A-Za-z0-9]/g, '');
  }

  var maps = _.map(dirs, function(dirname) {
    return {
      'name': dirname,
      'slug': cleanupName(dirname),
      'path': path + '/' + dirname
    };
  });

  return function(filename) {
    filename = cleanupName(filename);

    var bestMatch = null;

    _.each(maps, function(tvshow) {
      if (filename.indexOf(tvshow.slug) == -1) return;
      if (!bestMatch) {
        bestMatch = tvshow;
      } else if (tvshow.slug.length > bestMatch.slug.length) {
        bestMatch = tvshow
      }
    });

    return bestMatch;
  }
}
