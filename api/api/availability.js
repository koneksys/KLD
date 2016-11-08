"use strict";

let express = require('express'),
  debug = require('debug')('AvailabilityAPI'),
  router = express.Router(),
  conf = require('../conf/conf.js'),
  url = require('url'),
  BaseAPI = require('./base');

class AvailabilityAPI extends BaseAPI {
  constructor() {
    super();
    let self = this;

    this.router = express.Router();

    this.router.get('/ping', function (req, res) {
      let query = url.parse(req.url,true).query;

      debug('/ping query = ', query);
      if (!self.kickUnacceptedKldClient(query, res)) return;
      self.ping(function (result) {
        res.status(200).send(result);
      });
    });
  }

  ping(callback) {
    debug('ping()');
    if (callback) { callback({success: true}); }
  }

  getRouter() {
    return this.router;
  }
}

module.exports = AvailabilityAPI;
