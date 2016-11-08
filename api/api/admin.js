"use strict";

let express = require('express'),
  debug = require('debug')('AdminAPI'),
  url = require('url'),
  conf = require('../conf/conf.js'),
  BaseAPI = require('./base'),
  UserDBService = require('../service/userdb.service'),
  User = require('../model/user');

class AdminAPI extends BaseAPI {

  constructor() {
    super();
    let self = this;

    this.router = express.Router();
    this.userDBServiceInstance = new UserDBService(conf.dbUrl);

    this.router.get('/ping', function (req, res) {
      let query = url.parse(req.url,true).query;

      debug('/ping query = ', query);
      if (!self.kickUnacceptedAdminClient(query, {requiredAuthorization: 'read'}, res)) { return; }
      self.ping(function (result) {
        res.status(200).send(result);
      });
    });

    this.router.get('/users', function (req, res) {
      let query = url.parse(req.url,true).query;
      
      debug('/');
      if (!self.kickUnacceptedAdminClient(query, {requiredAuthorization: 'read'}, res)) { return };
        User.find({}, function(err, users) {
          res.json(users);
        });
    });

    debug('loaded');
  }

  ping(callback) {
    debug('ping()');
    if (callback) { callback({success: true}); }
  }

  getRouter() {
    return this.router;
  }
}

module.exports = AdminAPI;
