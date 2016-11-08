"use strict";

let express = require('express'),
  debug = require('debug')('OrganizationAPI'),
  router = express.Router(),
  conf = require('../conf/conf.js'),
  BaseAPI = require('./base'),
  ImportLogDAO = require('../model/importlog.dao'),
  OrgDAO = require('../model/org.dao')

class OrganizationAPI extends BaseAPI {

  constructor() {
    super();
    let self = this;

    this.router = express.Router();
    this.router.get('/list/:clientId', function (req, res) {
      let clientId = req.params.clientId;

      debug('/list/:clientId clientId = ', clientId);
      self.listOrgs(clientId, function (result) {
        res.status(200).send(result);
      });
    });

    this.router.get('/importedfile/:clientId/:id/:index', function (req, res) {
      let clientId = req.params.clientId,
        id = req.params.id,
        index = req.params.index;

      debug('/importedfile clientId = ', clientId);
      debug('/importedfile id = ', id);
      debug('/importedfile index = ', index);
      self.importedfile(clientId, id, index, function (result) {
        if (result.success) {
          let q = result.rdf;

          if (q === undefined || q === '') {
            q = 'undefined';
          }

          q = q.replace(/\</g, '&lt;');
          q = q.replace(/\>/g, '&gt;');

          res.send('<pre>' + q + '</pre>');
        } else {
          res.json('Not found imported file id=' + id + ', index=' + index);
        }
      });
    });

  }

  importedfile(clientId, id, index, callback) {
    let importLogDAO = new ImportLogDAO(),
      result = {
        success: false,
        rdf: ''
      };

    importLogDAO.load(global.dbUrls[clientId], {
      _id: id
    }, function (result) {
      if (result.success) {
        result.success = true;
        result.rdf = result.entity.logs[index].rdf;
        callback(result);
      } else {
        callback(result);
      }
    });
  }

  listOrgs(clientId, callback) {
    new OrgDAO().find(global.dbUrls[clientId], {}, function (result) {
      debug('listOrgs() result = ', result);
      if (callback) { callback(result); }
    })
  }

  getRouter() {
    return this.router;
  }
}

module.exports = OrganizationAPI;

