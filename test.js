var Aria2 = require('./aria2');

var aria = new Aria2('aria2c');

console.log(aria.addUri('http://cdn1.spiegel.de/images/image-571688-thumb-thor.jpg', '/tmp/test/images/image.jpg'));
console.log(aria.addUri('http://www.spiegel.de/politik/deutschland/csu-seehofers-triumph-beim-parteitag-a-935252.html', '/tmp/article.html'));
console.log(aria.inputFile());