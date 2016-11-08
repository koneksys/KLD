"use strict";

let debug = require('debug')('ServerBootstrap'),
  http = require('http'),
  express = require('express'),
  mongoose = require('mongoose'),
  cors = require('cors'),
  bodyParser = require('body-parser'),
  compression = require('compression'),
  app = express(),
  assert = require('assert'),
  dotenv = require('dotenv'),
  CloudAPI = require('./api/cloud'),
  cloudAPIInstance = new CloudAPI(),
  conf = require('./conf/conf'),
  port;

dotenv.load();

port = process.env.PORT || conf.apiPort;

app.use(cors());
app.use(compression());
app.use(bodyParser.json({limit: conf.limitJSONPostData}));
app.use(bodyParser.urlencoded({extended: true}));

app.use('/api/', cloudAPIInstance.getRouter());

http.createServer(app).listen(port, function (err) {
  if (err) {
    debug(err);
    return;
  }
  debug('Middleware API listening in http://localhost:' + port);
});
