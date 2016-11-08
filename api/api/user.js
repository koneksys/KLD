"use strict";

let express = require('express'),
  debug = require('debug')('UserAPI'),
  url = require('url'),
  geoip = require('geoip-lite'),
  conf = require('../conf/conf.js'),
  BaseAPI = require('./base'),
  UserDAO = require('../model/user.dao');

class UserAPI extends BaseAPI {

  constructor() {
    super();
    let self = this;

    this.router = express.Router();

    this.router.get('/ping', function (req, res) {
      let query = url.parse(req.url,true).query;

      debug('/ping query = ', query);
      if (!self.kickUnacceptedKldClient(query, res)) return;
      res.json({success: true});
    });


    this.router.get('/getClientInfo', function (req, res) {
      let query = url.parse(req.url,true).query,
        ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        result;

      debug('/getClientInfo query = ', query);
      if (!self.kickUnacceptedKldClient(query, res)) return;
      result = {
        success: true,
        ip: ip,
        geo: geoip.lookup(ip),
        headers: {
          origin: req.headers.origin,
          connection: req.headers.connection,
          accept: req.headers.accept,
          'user-agent': req.headers['user-agent'],
          'accept-language': req.headers['accept-language'],
          referer: req.headers.referer
        }
      };
      debug('/getClientInfo result = ', result);
      res.json(result);
    });

    this.router.post('/load', function(req, res) {
      let param = {
          clientId: req.body.clientId,
          email: req.body.email
        },
      result = {
        success: false,
        message: '',
        profile: {}
      };

      if (!self.kickUnacceptedKldClient(req.body, res)) return;
      new UserDAO().load(global.dbUrls[param.clientId], {organization: param.clientId, email: param.email }, function (loadResult) {
        result.success = loadResult.success;
        result.message = loadResult.message;
        result.profile = loadResult.entity;
        res.json(result);
      });

    });

    debug('loaded');
  }

  getRouter() {
    return this.router;
  }
}

module.exports = UserAPI;
