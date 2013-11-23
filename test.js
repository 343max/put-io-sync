require('longjohn');
var Aria2 = require('./aria2');

var aria = new Aria2('aria2c');

console.log(aria.addUri('http://cdn1.spiegel.de/images/image-571688-thumb-thor.jpg', '/tmp/test/images/image.jpg'));
console.log(aria.addUri('http://www.spiegel.de/politik/deutschland/csu-seehofers-triumph-beim-parteitag-a-935252.html', '/tmp/test/article.html'));
var process = aria.exec(function(complete, incomplet) {
  console.dir(complete);
});

//console.dir(aria.parseOut(['11/23 18:58:44 [NOTICE] Download complete: /tmp/test/article.html',
//'',
//'11/23 18:58:44 [NOTICE] Download complete: /tmp/test/images/image.jpg',
//'',
//'Download Results:',
//'  gid   |stat|avg speed  |path/URI',
//'  ======+====+===========+=======================================================',
//'100000|OK  |   331KiB/s|/tmp/test/article.html',
//'200000|OK  |    53KiB/s|/tmp/test/images/image.jpg'].join('\n')));