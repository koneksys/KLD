var express = require('express');
var app = express();

app.use(express.static(__dirname + '/asset.default'));
app.use(function(req, res) {
  res.sendfile(__dirname + '/asset.default/index.html');
});

app.listen(3000);
console.log("App listening on port 3000");
