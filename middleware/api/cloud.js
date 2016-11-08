"use strict";

let fs = require('fs'),
  express = require('express'),
  debug = require('debug')('CloudAPI'),
  url = require('url'),
  conf = require('../conf/conf.js'),
  Runner = require('../lib/runner'),
  Generator = require('../lib/generator');

class CloudAPI {

  constructor() {
    let self = this;

    this.runner = new Runner();
    this.generator = new Generator();
    this.router = express.Router();

    this.router.get('/', function (req, res) {
      debug('/');
      res.json({message: 'Ping!'});
    });

    this.router.get('/ping', function (req, res) {
      debug('/ping');
      res.json({message: 'Ping!'});
    });

    this.router.post('/mapping/', function (req, res) {
      debug('req', req.headers);
      let clientId = req.headers.clientid,
        provisioningName = req.headers.provname,
        provisioningDBPath = req.headers.provdbpath,
        provisioningFile =  provisioningDBPath + '/profiles/' + provisioningName + '.provisioning.json',
        provisioningFileContent,
        provisioningJson,
        result = {
          success: false,
          message: '',
          clientId: clientId,
          mapping: {}
        };

      debug('/mapping clientId = ', clientId);
      debug('/mapping provisioningName = ', provisioningName);
      debug('/mapping provisioningDBPath = ', provisioningDBPath);
      debug('/mapping provisioningFile = ', provisioningFile);
      if (fs.existsSync(provisioningFile)) {
        provisioningFileContent = fs.readFileSync(provisioningFile).toString();
        provisioningJson = JSON.parse(provisioningFileContent);
        if (provisioningJson.provisioning.organizations[clientId] === undefined) {
          result.message = 'clientId = ' + clientId + ' not found';
          debug('/mapping result = ', result);
          res.json(result);
        } else {
           result.success = true;
           result.mapping = provisioningJson.provisioning.organizations[clientId];
           if (result.mapping['maps'] === undefined) {
            result.mapping.maps = {}
           }

          if (result.mapping['prefixes'] === undefined) {
            result.mapping.prefixes = {}
           }
           // debug('/mapping result = ', result);
           res.json(result);
        }
      } else {
        result.message = provisioningFile + ' not found';
        debug('/mapping result = ', result);
        res.json(result);
      }
    });

    this.router.post('/provisioning.db.delete', function (req, res) {
      let gen = new Generator(),
        result = {
          success: false,
          message: ''
        };

      gen.deleteFusekiTdbs(JSON.stringify(req.body.provisioning, null, 2), function (fusekiDelDBResult) {
        debug('post /provisioning.db.delete deleteFusekiTdbs = ', fusekiDelDBResult);
        if (fusekiDelDBResult.success) {
          gen.deleteSolrCores(JSON.stringify(req.body.provisioning, null, 2), function (solrDelDBResult) {
            debug('post /provisioning.db.delete deleteSolrCores = ', solrDelDBResult);
            if (!fusekiDelDBResult.success) {
              result.message = 'Triplestore database cannot be deleted: ' + fusekiDelDBResult.message;
              res.json(result);
            } else if (!solrDelDBResult.success) {
              result.message = 'Search engine database cannot be deleted: ' + solrDelDBResult.message;
              res.json(result);
            } else if (fusekiDelDBResult.success && solrDelDBResult.success) {
              result.success = true;
              result.message = 'Provisioning database has been deleted';
              res.json(result);
            }
          });
        } else {
          result.message = 'Provisioning database cannot be deleted: ' + fusekiDelDBResult.message;
          res.json(result);
        }
      });
    });

    this.router.post('/datastore.start', function (req, res) {
      let runner = new Runner(),
        result = {
          success: false,
          message: ''
        };

      debug('post /datastore.start provisioning = ', req.body.provisioning);
      runner.startFUSEKI(JSON.stringify(req.body.provisioning, null, 2), function (fusekiStartResult) {
        debug('post /datastore.start startFUSEKI = ', fusekiStartResult);
        runner.startSOLR(JSON.stringify(req.body.provisioning, null, 2), function (solrStartResult) {
          debug('post /datastore.start startSOLR = ', solrStartResult);
          new Generator().addSolrCores(JSON.stringify(req.body.provisioning, null, 2), function (solrAddCoresResult) {
            debug('post /datastore.start addSolrCores = ', solrAddCoresResult);
            if (!fusekiStartResult.success) {
              result.message = 'Triplestore cannot be started: ' + fusekiStartResult.message;
              res.json(result);
            } else if (!solrStartResult.success) {
              result.message = 'Search engine cannot be started: ' + solrStartResult.message;
              res.json(result);
            } else if (!solrAddCoresResult.success) {
              result.message = 'Search engine\'s databases cannot be established: ' + solrAddCoresResult.message;
              res.json(result);
            } else if (fusekiStartResult.success && solrStartResult.success && solrAddCoresResult.success) {
              result.success = true;
              result.message = 'Datastore has been started';
              res.json(result);
            }
          });
        });
      });
    });

    this.router.post('/datastore.stop', function (req, res) {
      let runner = new Runner(),
        result = {
          success: false,
          message: ''
        };

      debug('post /datastore.stop');
      runner.stopFUSEKI(function (fusekiStopResult) {
        debug('post /datastore.stop stopFUSEKI = ', fusekiStopResult);
        runner.stopSOLR(function (solrStopResult) {
          debug('post /datastore.stop stopSOLR = ', solrStopResult);
          if (!fusekiStopResult.success) {
            result.message = 'Triplestore cannot be stopped: ' + fusekiStopResult.message;
            res.json(result);
          } else if (!solrStopResult.success) {
            result.message = 'Search engine cannot be stopped: ' + solrStopResult.message;
            res.json(result);
          } else if (fusekiStopResult.success && solrStopResult.success) {
            result.success = true;
            result.message = 'Datastore has been stopped';
            res.json(result);
          }
        });
      });
    });

    this.router.post('/provisioning.add', function (req, res) {
      debug('post /provisioning.add provisioning = ', req.body.provisioning);
      new Generator().addProvisioning(JSON.stringify(req.body.provisioning, null, 2), function (result) {
        debug('post /provisioning.add result = ', result);
        res.json(result);
      });
    });


    this.router.post('/provisioning.delete', function (req, res) {
      debug('post /provisioning.delete provisioning = ', req.body.provisioning);
      new Generator().deleteProvisioning(JSON.stringify(req.body.provisioning, null, 2), function (result) {
        debug('post /provisioning.delete result = ', result);
        res.json(result);
      });
    });

    this.router.post('/conf.gen', function (req, res) {
      debug('post /conf.gen graphName = ', req.body.graphName);
      debug('post /conf.gen rdfDir = ', req.body.rdfDir);
      debug('post /conf.gen outputDir = ', req.body.outputDir);
      new Generator().generateConfPatchFromDir(req.body.graphName, req.body.rdfDir, req.body.outputDir, function (result) {
        debug('post /conf.gen result.message = ', result.message);
        res.json(result);
      });
    });

    this.router.post('/conf.add', function (req, res) {
      debug('post /conf.add provisioning = ', req.body.provisioning);
      debug('post /conf.add patchDir = ', req.body.patchDir);
      new Generator().addConfPatchFromDir(JSON.stringify(req.body.provisioning, null, 2), req.body.patchDir, function (result) {
        debug('post /conf.add result.message = ', result.message);
        res.json(result);
      });
    });

    this.router.post('/data.gen', function (req, res) {
      debug('post /data.gen graphName = ', req.body.graphName);
      debug('post /data.gen rdfDir = ', req.body.rdfDir);
      debug('post /data.gen format = ', req.body.format);
      debug('post /data.gen outputDir = ', req.body.outputDir);
      new Generator().generateDataPatchFromDir(
        req.body.graphName,
        req.body.rdfDir,
        req.body.format,
        req.body.outputDir,
        function (result) {
          debug('post /data.gen result = ', result.message);
          res.json(result);
      });
    });

    this.router.post('/data.add', function (req, res) {
      debug('post /data.add provisioning = ', req.body.provisioning);
      debug('post /data.add generatedDataPatchDir = ', req.body.generatedDataPatchDir);
      debug('post /data.gen format = ', req.body.format);
      debug('post /data.gen datasetIdentifier = ', req.body.datasetIdentifier);
      debug('post /data.gen fusekiBaseUrl = ', req.body.fusekiBaseUrl);
      new Generator().addDataPatchFromDir(
        JSON.stringify(req.body.provisioning, null, 2),
        req.body.generatedDataPatchDir,
        req.body.format,
        req.body.datasetIdentifier,
        req.body.fusekiBaseUrl,
        function (result) {
        debug('post /data.add result.message = ', result.message);
        res.json(result);
      });
    });

  }

  getRouter() {
    return this.router;
  }
}

module.exports = CloudAPI;
