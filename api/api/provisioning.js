"use strict";

let express = require('express'),
  debug = require('debug')('ProvisioningAPI'),
  fs = require('fs'),
  router = express.Router(),
  UUID = require('node-uuid'),
  request = require('request'),
  conf = require('../conf/conf.js'),
  url = require('url'),
  BaseAPI = require('./base'),
  ImportLogDAO = require('../model/importlog.dao'),
  DatasetDAO = require('../model/dataset.dao'),
  UserDAO = require('../model/user.dao'),
  CsvService = require('../service/csv.service');


class ProvisioningAPI extends BaseAPI {

  constructor() {
    super();
    let self = this;

    this.request = request;
    this.router = express.Router();

    this.router.get('/ping', function (req, res) {
      let query = url.parse(req.url,true).query;

      debug('/ping query = ', query);
      if (!self.kickUnacceptedKldClient(query, res)) return;
      self.ping(function (result) {
        res.status(200).send(result);
      });
    });

    this.router.post('/provisioning.conf', function(req, res) {
      if (!self.kickUnacceptedKldClient(req.body, res)) return;
      res.json(conf.acceptedClients[req.body.clientId]);
    });

    this.router.post('/provisioning.appstore', function(req, res) {
      let organization = req.body.organization,
          email = req.body.email,
          app = req.body.app,
          operation = req.body.operation,
          op = operation === 'install' ? true : false,
          result = {
            success: false,
            message: '',
            entity: {}
          }

      debug('/post provisioning.appstore app = ', app);
      debug('/post provisioning.appstore operation = ', operation);
      debug('/post provisioning.appstore op = ', op);
      if (!self.kickUnacceptedKldClient(req.body, res)) return;
      new UserDAO().load(global.dbUrls[organization], {organization: organization, email: email}, function (userLoadResult) {
        debug('/post provisioning.appstore userLoadResult = ', userLoadResult);
        if (userLoadResult.entity !== undefined) {
          debug('/post provisioning.appstore before = ', userLoadResult.entity.authorizations);
          userLoadResult.entity.authorizations[app] = op;
          debug('/post provisioning.appstore after = ', userLoadResult.entity.authorizations);
          new UserDAO().updateSet(global.dbUrls[organization],
            {email: email},
            {authorizations: userLoadResult.entity.authorizations},
            function (userUpdateResult) {
              new UserDAO().load(global.dbUrls[organization],
                {organization: organization, email: email},
                function (userReloadResult) {
                  result.success = true;
                  result.entity = userReloadResult.entity;
                  result.message = app + ' has been ' + operation + 'ed';
                  debug('/post provisioning.appstore result = ', result);
                  res.json(result);
                });
            });
        } else {
          result.message = userLoadResult.message;
          debug('/post provisioning.appstore userLoadResult = ', userLoadResult);
          res.json(result);
        }
      });

    });

    this.router.post('/provisioning.db.delete', function(req, res) {
      let param = {
          clientId: req.body.clientId,
          email: req.body.email,
          provisioning: conf.acceptedClients[req.body.clientId].backend
        };

      debug('post /provisioning.delete');
      if (!self.kickUnacceptedKldClient(req.body, res)) return;
      self.callMiddleware('provisioning.db.delete', 'post', param, function (result) {
        debug('post /dprovisioning.db.delete result = ', result);
        res.json(result);
      });

      new DatasetDAO().delete(global.dbUrls[param.clientId], {organization: param.clientId}, function (deleteResult) {
        debug('post /dprovisioning.db.delete DatasetDAO = ', deleteResult);
      });

      new ImportLogDAO().delete(global.dbUrls[param.clientId], {organization: param.clientId}, function (deleteResult) {
        debug('post /dprovisioning.db.delete ImportLogDAO = ', deleteResult);
      });

      new UserDAO().update(global.dbUrls[param.clientId],
        {organization: param.clientId, email: param.email },
        {$set: {tripleUsage: 0}},
        function (deleteResult) {
        debug('post /dprovisioning.db.delete ImportLogDAO = ', deleteResult);
      });

    });

    this.router.post('/provisioning.delete.without.datasetcleanup', function(req, res) {
      let param = {
          clientId: req.body.clientId,
          email: req.body.email,
          provisioning: conf.acceptedClients[req.body.clientId].backend
        };

      debug('post /provisioning.delete.without.datasetcleanup');
      if (!self.kickUnacceptedKldClient(req.body, res)) return;
      self.callMiddleware('provisioning.db.delete', 'post', param, function (result) {
        debug('post /provisioning.delete.without.datasetcleanup result = ', result);
        res.json(result);
      });

      new ImportLogDAO().delete(global.dbUrls[param.clientId], {organization: param.clientId}, function (deleteResult) {
        debug('post /dprovisioning.db.delete ImportLogDAO = ', deleteResult);
      });

      new UserDAO().update(global.dbUrls[param.clientId],
        {organization: param.clientId, email: param.email },
        {$set: {tripleUsage: 0}},
        function (deleteResult) {
        debug('post /dprovisioning.db.delete ImportLogDAO = ', deleteResult);
      });

    });

    this.router.post('/datastore.start', function(req, res) {
      let param = {
          clientId: req.body.clientId,
          provisioning: conf.acceptedClients[req.body.clientId].backend
        };

      if (!self.kickUnacceptedKldClient(req.body, res)) return;
      self.callMiddleware('datastore.start', 'post', param, function (result) {
        debug('post /datastore.start result = ', result);
        res.json(result);
      });
    });

    this.router.post('/datastore.stop', function(req, res) {
      let param = {
          clientId: req.body.clientId,
          provisioning: conf.acceptedClients[req.body.clientId].backend
        };

      if (!self.kickUnacceptedKldClient(req.body, res)) return;
      self.callMiddleware('datastore.stop', 'post', param, function (result) {
        debug('post /datastore.stop result = ', result);
        res.json(result);
      });
    });

    this.router.post('/provisioning.add', function(req, res) {
      let param = {
          clientId: req.body.clientId,
          provisioning: conf.acceptedClients[req.body.clientId].backend
        };

      if (!self.kickUnacceptedKldClient(req.body, res)) return;
      self.callMiddleware('provisioning.add', 'post', param, function (result) {
        debug('post /provisioning.add result = ', result);
        res.json(result);
      });
    });

    this.router.post('/provisioning.delete', function(req, res) {
      let param = {
          clientId: req.body.clientId,
          provisioning: conf.acceptedClients[req.body.clientId].backend
        };

      if (!self.kickUnacceptedKldClient(req.body, res)) return;
      self.callMiddleware('provisioning.delete', 'post', param, function (result) {
        debug('post /provisioning.delete result = ', result);
        res.json(result);
      });
    });

    this.router.post('/conf.prepare.dir', function(req, res) {
      let param = {
          clientId: req.body.clientId,
          email: req.body.email,
          files: req.body.files,
          dirPath: req.body.dirPath
        },
        result = {
          success: false,
          message: ''
        };

      /*
      object
        response: Object
          file: Object
              destination: "/srv/uploads/"
              encoding: "7bit"
              fieldname: "file"
              filename: "c659d1ccaeda1268b294480a0e78ce72"
              mimetype: "application/octet-stream"
              originalname: "validRDFXML.rdf"
              path: "/srv/uploads/c659d1ccaeda1268b294480a0e78ce72"
              size: 5049
          format: "rdf"
          message: "rdf uploaded"
        success: true
       */
      if (!self.kickUnacceptedKldClient(req.body, res)) return;
      debug('post /conf.prepare.dir param = ', param);
      param.dirPath += '_' + UUID.v4();
      if (!fs.existsSync(param.dirPath)){
        fs.mkdirSync(param.dirPath);
        debug('\tCreated ' + param.dirPath);
      }
      
      param.files.forEach(function (file, index) {
        fs.writeFile(param.dirPath + '/' + param.email + '_' + file.originalname , fs.readFileSync(file.path).toString(), function (err) {
          debug('\t file writing err', err);
          if (err) {
            result.message = err.toString();
            debug('\t', result);
            res.json(result);
          } else {
            debug('\tDeleting old file ', file.path);
            fs.unlinkSync(file.path);
            debug('\tDeleting index ', index);
            debug('\tDeleting param.files.length ', param.files.length);
            if (index === param.files.length - 1) {
              result.success = true;
              result.message = 'prepared';
              result.fileName = file.originalname;
              result.format = file.originalname.split('.').pop();
              result.rdfDir = param.dirPath + '/';
              result.fileDir = param.dirPath + '/';
              result.outputDir = param.dirPath;
              if (!fs.existsSync(result.outputDir)){
                fs.mkdirSync(result.outputDir);
              }
              debug('\t', result);
              res.json(result);
            }
          }
        });
      });
    });

    this.router.post('/convert.csv2rdfxml', function(req, res) {
      let clientId = req.body.clientId,
        email = req.body.email,
        domain = req.body.domain,
        csvFileName = req.body.csvFileName,
        csvFileDir = req.body.csvFileDir,
        filePath = csvFileDir + csvFileName,
        fileContent = fs.readFileSync(filePath).toString(),
        csvHeaders = [],
        csvHeaderMap = {},
        csvRows = [],
        csvService = new CsvService(),
        result = {
          success: false,
          message: '',
          numOfCols: 0,
          csvHeaders: [],
          csvHeaderMap: {},
          csvRows: []
        };

      if (!self.kickUnacceptedKldClient(req.body, res)) return;
      debug('post /convert.csv2rdfxml email = ', email);
      debug('post /convert.csv2rdfxml domain = ', domain);
      debug('post /convert.csv2rdfxml csvFileName = ', csvFileName);
      debug('post /convert.csv2rdfxml csvFileDir = ', csvFileDir);
      debug('post /convert.csv2rdfxml filePath = ', filePath);
      debug('post /convert.csv2rdfxml fileContent = ', fileContent);
      csvService.parse(fileContent, function (csvServiceResult) {
        debug('post /convert.csv2rdfxml csvServiceResult = ', csvServiceResult);
        csvServiceResult.data.forEach(function (csvRow, index) {
          if (index === 0) {
            csvHeaders.push(csvRow);
            csvRow.forEach(function (header) {
              csvHeaderMap[header] = header;
            });
          } else {
            csvRows.push(csvRow);
          }

          if (index === csvServiceResult.data.length - 1) {
            result.numOfCols = csvHeaders.length;
            result.csvHeaders = csvHeaders;
            result.csvHeaderMap = csvHeaderMap;
            result.csvRows = csvRows;
            debug('post /convert.csv2rdfxml result = ', result);
            csvService.buildRdfXML(
              domain,
              csvFileName,
              result.csvHeaders,
              result.csvHeaderMap,
              result.csvRows,
              function (builtRdfXml) {
                fs.writeFile(
                  csvFileDir + csvFileName.replace('csv', 'rdf'),
                  builtRdfXml,
                  function (writeFileErr) {
                    if (writeFileErr) {
                      res.json({success: true});
                    } else {
                      res.json({success: false});
                    }
                  }
                );
              }
            );
          }
        });
      });
    });

    this.router.post('/conf.gen', function(req, res) {
      let param = {
          clientId: req.body.clientId,
          graphName: req.body.graphName,
          rdfDir: req.body.rdfDir,
          outputDir: req.body.outputDir
        },
        result = {
          success: false,
          message: ''
        };

      if (!self.kickUnacceptedKldClient(req.body, res)) return;
      self.callMiddleware('conf.gen', 'post', param, function (genResult) {
        if (genResult.success) {
          result.success = true;
          result.message = genResult.message;
          result.patchDir = param.outputDir + '/';
          debug('/conf.gen result = ', result);
          res.json(result);
        } else {
          result.message = genResult.message;
          debug('/conf.gen result.message = ', result.message);
          res.json(result);
        }
      });
    });

    this.router.post('/conf.add', function(req, res) {
      let param = {
          clientId: req.body.clientId,
          provisioning: conf.acceptedClients[req.body.clientId].backend,
          patchDir: req.body.patchDir
        };

      if (!self.kickUnacceptedKldClient(req.body, res)) return;
      self.callMiddleware('conf.add', 'post', param, function (result) {
        debug('post /conf.add result.message = ', result.message);
        res.json(result);
      });
    });

    this.router.post('/data.gen', function(req, res) {
      let param = {
          clientId: req.body.clientId,
          graphName: req.body.graphName,
          rdfDir: req.body.rdfDir,
          format: req.body.format,
          outputDir: req.body.outputDir
        };

      if (!self.kickUnacceptedKldClient(req.body, res)) return;
      debug('/data.gen param = ', param);
      self.callMiddleware('data.gen', 'post', param, function (result) {
        debug('/data.gen result.message = ', result.message);
        res.json(result);
      });
    });

    this.router.post('/data.add', function(req, res) {
      let param = {
          clientId: req.body.clientId,
          provisioning: conf.acceptedClients[req.body.clientId].backend,
          generatedDataPatchDir: req.body.generatedDataPatchDir,
          datasetIdentifier: req.body.datasetIdentifier,
          fusekiBaseUrl: conf.acceptedClients[req.body.clientId].fusekiBaseUrl,
          format: req.body.format,
        };

      if (!self.kickUnacceptedKldClient(req.body, res)) return;
      self.callMiddleware('data.add', 'post', param, function (result) {
        debug('post /data.add result.message = ', result.message);
        res.json(result);
      });
    });

    this.router.post('/log.add', function(req, res) {
      let param = {
          organization: req.body.organization,
          email: req.body.email,
          logs: req.body.logs
        };

      if (!self.kickUnacceptedKldClient(req.body, res)) return;
      self.logAdd(param.organization, param.email, param.logs, function (result) {
        debug('post /log.add result.message = ', result.message);
        res.json(result);
      });
    });

    this.router.post('/log.list', function(req, res) {
      let param = {
          organization: req.body.organization,
          email: req.body.email
        };

      debug('post /log.add organization = ', param.organization);
      debug('post /log.add email = ', param.email);
      if (!self.kickUnacceptedKldClient(req.body, res)) return;
      self.logList(param.organization, param.email, function (result) {
        debug('post /log.add result.message = ', result.message);
        res.json(result);
      });
    });

  }

  ping(callback) {
    debug('ping()');
    if (callback) { callback({success: true}); }
  }

  logAdd(organization, email, logs, callback) {
    let importLogDAO = new ImportLogDAO();

    debug('logAdd() organization = ', organization);
    debug('logAdd() email = ', email);
    debug('logAdd() logs = ', logs);
    this.addTripleUsageToUserAccount(organization, email, logs);
    importLogDAO.create(global.dbUrls[organization], {
      organization: organization,
      email: email,
      creationDate: new Date(),
      logs: logs
    }, function (result) {
      debug('logAdd() result = ', result);
      if (callback) { callback(result); }
    });
  }

  addTripleUsageToUserAccount(organization, email, logs, callback) {
    let userLogDAO = new UserDAO(),
      countTriple = 0,
      tripleUsageHistories = [];

    logs.forEach(function (log, index) {
      countTriple += log.countTriple;
    });

    userLogDAO.updateSet(global.dbUrls[organization],
      { organization: organization, email: email },
      { $inc: {
          tripleUsage: countTriple
        }
      },
      function (result) {
        debug('logAdd() result = ', result);
        if (callback) { callback(result); }
      });
  }

  logList(organization, email, callback) {
    let importLogDAO = new ImportLogDAO();

    debug('logList() organization = ', organization);
    debug('logList() email = ', email);
    importLogDAO.find(global.dbUrls[organization], {
      organization: organization,
      email: email
    }, function (result) {
      if (callback) { callback(result); }
    });
  }

  callMiddleware(path, method, param, callback) {
    let webserviceUrl = conf.middlewareWebServiceBasedUrl + '/api/' + path,
      options = {
        method: method,
        uri: webserviceUrl,
        encoding: 'utf8',
        body: JSON.stringify(param),
        timeout: 0,
        forever: true,
        headers: {
          accept: 'application/json',
          'content-type': 'application/json'
        },
      },
      result = {
        success: false,
        message: ''
      };

    debug('callMiddleware() options = ', options);
    request(options, function(err, response, body) {
      try {
          if (err) {
            debug('callMiddleware() error = ', err);
            result.message = 'Cannot connect middleware api';
            if (callback) { callback(result); }
          } else {
            result = JSON.parse(body);
            debug('callMiddleware() success.message = ', result.message);
            if (callback) { callback(result); }
          }
          
        } catch (error) {
          debug('callMiddleware() error = ', error);
          result.message = error.toString();
          if (callback) { callback(result); }
        }
    });
  }

  getRouter() {
    return this.router;
  }
}

module.exports = ProvisioningAPI;

