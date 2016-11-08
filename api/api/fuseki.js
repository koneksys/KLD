"use strict";

let express = require('express'),
  debug = require('debug')('FusekiAPI'),
  router = express.Router(),
  querystring = require('querystring'),
  dateFormat = require('dateformat'),
  request = require('request'),
  UUID = require('node-uuid'),
  fs = require('fs'),
  fse = require('fs-extra'),
  exec = require("child_process").exec,
  conf = require('../conf/conf.js'),
  url = require('url'),
  BaseAPI = require('./base');

class FusekiAPI extends BaseAPI {
  constructor() {
    super();
    let self = this;

    this.router = express.Router();

    this.router.get('/ping', function (req, res) {
      let query = url.parse(req.url,true).query;

      debug('/ping query = ', query);
      if (!self.kickUnacceptedKldClient(query, res)) return;
      self.ping(function (result) {
        res.json(result);
      });
    });

    this.router.get('/fusekiMapping', function (req, res) {
      let query = url.parse(req.url,true).query;

      debug('/fusekiMapping query = ', query);
      if (!self.kickUnacceptedKldClient(query, res)) return;
      self.fusekiMapping(query.clientId, function (result) {
        res.json(result);
      });
    });

    this.router.post('/sparqlQuery', function (req, res) {
      let queryStatement = req.body.queryStatement;
      let format = req.body.format;
      let clientId = req.body.clientId;

      debug('/sparqlQuery clientId = ', clientId);
      debug('/sparqlQuery queryStatement = ', queryStatement);
      debug('/sparqlQuery format = ', format);
      if (!self.kickUnacceptedKldClient(req.body, res)) return;
      self.sparqlQuery(clientId, queryStatement, format, function (result) {
        res.json(result);
      });
    });

    this.router.post('/sparqlUpdate', function (req, res) {
      let updateStatementWithoutGraphName = req.body.updateStatementWithoutGraphName,
        updateStatement = req.body.updateStatement,
        clientId = req.body.clientId;

      debug('/sparqlUpdate clientId = ', clientId);
      debug('/sparqlUpdate updateStatementWithoutGraphName = ', updateStatementWithoutGraphName);
      debug('/sparqlUpdate updateStatement = ', updateStatement);
      if (!self.kickUnacceptedKldClient(req.body, res)) return;
      self.sparqlUpdate(clientId, updateStatementWithoutGraphName, updateStatement, function (result) {
        res.json(result);
      });
    });

    this.router.post('/writeOslcRdfFilesAtServer', function (req, res) {
      debug('/import.oslc');
      if (!self.kickUnacceptedKldClient(req.body, res)) return;
      self.writeOslcRdfFilesAtServer(req, function (result) {
        res.json(result);
      });
    });

    this.router.post('/zip.import.files', function (req, res) {
      let serviceProviderCatalogUID = req.body.serviceProviderCatalogUID,
        importWithServiceProviderCatalog = req.body.importWithServiceProviderCatalog;

      debug('/zip.import.files');
      debug('/zip.import.files serviceProviderCatalogUID = ', serviceProviderCatalogUID);
      debug('/zip.import.files importWithServiceProviderCatalog = ', importWithServiceProviderCatalog);
      if (!self.kickUnacceptedKldClient(req.body, res)) return;
      self.zipImportFiles(serviceProviderCatalogUID, importWithServiceProviderCatalog, function (result) {
        res.json(result);
      });
    });
  }

  ping(callback) {
    debug('ping()');
    if (callback) { callback({success: true}); }
  }

  fusekiMapping(clientId, callback) {
    let webserviceUrl = conf.middlewareWebServiceBasedUrl + '/api/mapping/',
      options = {
        uri: webserviceUrl,
        encoding: 'utf8',
        headers: {
          clientid: clientId,
          provname: conf.acceptedClients[clientId].backend.provisioning.name,
          provdbpath: conf.acceptedClients[clientId].backend.provisioning.dbPath
        }
      },
      data = {
          success: false,
          message: '',
          data: {}
        };

    debug('fusekiMapping() clientId = ', clientId);
    debug('fusekiMapping() webserviceUrl = ', webserviceUrl);
    debug('fusekiMapping() options = ', options);
    try {
      request.post(options, function(err, response, body) {
        if (err) {
          data.success = false;
          data.data = body;
          if (callback) { callback(body); }
        } else {
          data.success = true;
          data.data = body;
          if (callback) { callback(body); }
        }
      });
    } catch (error) {
      data.message = error.toString();
      debug(data);
      if (callback) { callback(data); }
    }
  }

  writeOslcRdfFilesAtServer(req, callback) {
    let self = this,
      clientId = req.body.clientId,
      domain = req.body.domain,
      clientTime = new Date(),
      serviceProvider = req.body.serviceProvider,
      serviceNode = req.body.serviceNode,
      serviceProviderCatalogURI = req.body.serviceProviderCatalogURI,
      importWithServiceProviderCatalog = req.body.importWithServiceProviderCatalog,
      serviceProviderCatalogUID = req.body.serviceProviderCatalogUID,
      uniquePath = conf.acceptedClients[clientId].oslcImportDir + '/' + req.body.uniquePath,
      importDate = dateFormat(clientTime, 'yyyy-mmm-dd h:MM:ss TT Z'),
      importDateForFile = dateFormat( clientTime, 'yyyy-mmm-dd_hhMMssTT'),
      catalogZipFileName = serviceProviderCatalogUID + '.tar.gz',
      providerZipFileName = serviceProvider.Title + '.' + serviceProviderCatalogUID + '.tar.gz',
      fileName = serviceProvider.Title + '_' + serviceNode.title + '.' + serviceProviderCatalogUID + '.rdf',
      filePath,
      rdfContent,
      result = {
        success: false,
        message: '',
        uploadedRdfDir: uniquePath + '/'
      };

    if (!fs.existsSync(uniquePath)) {
      fs.mkdirSync(uniquePath);
    }

    filePath = uniquePath + '/' + fileName,
    debug('writeOslcRdfFilesAtServer() serviceProviderCatalogURI: ' + serviceProviderCatalogURI);
    debug('writeOslcRdfFilesAtServer() serviceProviderCatalogUID: ' + serviceProviderCatalogUID);
    debug('writeOslcRdfFilesAtServer() importWithServiceProviderCatalog: ' + importWithServiceProviderCatalog);
    debug('writeOslcRdfFilesAtServer() importDate: ' + importDate);
    debug('writeOslcRdfFilesAtServer() importDateForFile: ' + importDateForFile);
    debug('writeOslcRdfFilesAtServer() fileName: ' + fileName);
    debug('writeOslcRdfFilesAtServer() uniquePath: ' + uniquePath);
    debug('writeOslcRdfFilesAtServer() filePath: ' + filePath);
    rdfContent = serviceNode.queryBaseRdf + '\n\n';
    fs.writeFile(filePath, rdfContent, function (err) {
      if (err) {
        result.message = 'Cannot write temp file for OSLC resource';
        debug('writeOslcRdfFilesAtServer() result: ', result);
        callback(result);
      } else {
        result.success = true;
        result.message = filePath + ' is uploaded!'
        debug('writeOslcRdfFilesAtServer() result: ', result);
        callback(result);
      }
    });
  }

  zipImportFiles(serviceProviderCatalogUID, importWithServiceProviderCatalog, callback) {
    let result = {
        success: false,
        message: ''
      },
      cmd,
      zipFilePath,
      targetZipFileItem,
      zip;

    debug('serviceProviderCatalogUID = ' + serviceProviderCatalogUID);
    debug('importWithServiceProviderCatalog = ' + importWithServiceProviderCatalog);
    try { 
      cmd = '';
      zipFilePath =  serviceProviderCatalogUID + '.tar.gz';
      fse.ensureFile( zipFilePath , function (err) {
        if (!err) {
          fs.unlinkSync(zipFilePath);
        }
      });

      targetZipFileItem =  '*.' + serviceProviderCatalogUID + '.rdf';
      cmd = 'cd ../middleware/data/uploads/; tar vcfz ' + zipFilePath + ' ' + targetZipFileItem + ';';
      debug('cmd = ' + cmd);
      zip  = exec(cmd);
      zip.stdout.on('data', function (data) {
        debug(data.toString());
      });
      zip.stderr.on('data', function (data) {
        debug(data.toString());
      });
      zip.on('close', function (code) {
        debug('closing code: ' + code);
        if (code === 0) {
          result.success = true;
          result.message = zipFilePath + ' has been zipped';
          callback(result);
        } else {
          result.message = 'TAR cmd does not terminate properly'
          callback(result);
        }
      });
    } catch (ex) {
      result.message = ex.toString();
      callback(result);
    }
  }

  sparqlQuery(clientId, queryStatement, format, callback) {
    let output = format.toLowerCase() === 'table' ? 'json' : format,
      fusekiQueryUrl = conf.acceptedClients[clientId].fusekiQueryUrl,
      options = {
        uri: fusekiQueryUrl,
        headers: {
          accept: 'application/sparql-results+json',
          'content-type': 'application/sparql-query'
        },
        encoding: 'utf8',
        body: queryStatement
      },
      result = {
        success: false,
        message: '',
        resources: {}
      };

    debug('sparqlQuery() queryStatement = ', queryStatement.query_statement);
    debug('sparqlQuery() options = ', options);
    try {
      request.post(options, function(err, response, body) {
        if (err) {
          result.message = err.toString();
          // debug('sparqlQuery() result = ', result);
          if (callback) { callback(result); }
        } else {
          result.success = true;
          result.message = 'performed';
          result.resources = body;
          // debug('sparqlQuery() result = ', result);
          if (callback) { callback(result); }
        }
      });
    } catch (error) {
      result.message = error.toString();
      debug('sparqlQuery() result = ', result);
      if (callback) { callback(result); }
    }
  }

  sparqlUpdate(clientId, updateStatementWithoutGraphName, updateStatement, callback) {
    let fusekiBaseUrl = conf.acceptedClients[clientId].fusekiBaseUrl,
      useInfer = conf.acceptedClients[clientId].useInfer,
      fulltextOptions = {
        uri: fusekiBaseUrl + 'Fulltext/update',
        headers: {
          accept: 'application/sparql-results+json',
          'content-type': 'application/sparql-update'
        },
        encoding: 'utf8',
        body: updateStatement
      },
      inferOptions = {
        uri: fusekiBaseUrl + 'Infer/update',
        headers: {
          accept: 'application/sparql-results+json',
          'content-type': 'application/sparql-update'
        },
        encoding: 'utf8',
        body: updateStatementWithoutGraphName
      },
      result = {
        success: false,
        message: '',
        resources: {}
      };

    debug('sparqlUpdate() updateStatementWithoutGraphName = ', updateStatementWithoutGraphName);
    debug('sparqlUpdate() updateStatement = ', updateStatement);
    debug('sparqlUpdate() fulltextOptions = ', fulltextOptions);
    debug('sparqlUpdate() inferOptions = ', inferOptions);
    try {
      request.post(fulltextOptions, function(err, response, body) {
        if (err) {
          result.message = err.toString();
          debug('sparqlUpdate() result = ', result);
          if (callback) { callback(result); }
        } else {
          if (useInfer) {
            request.post(inferOptions, function(inferErr, inferResponse, inferBody) {
              if (inferErr) {
                result.message = inferErr.toString();
                debug('sparqlUpdate(infer) result = ', result);
                if (callback) { callback(result); }
              } else {
                result.success = (inferBody.indexOf('Error') == -1) ? true : false;
                result.message = 'performed';
                result.resources = inferBody;
                debug('sparqlUpdate(infer) result = ', result);
                if (callback) { callback(result); }
              }
            });
          } else {
            result.success = (body.indexOf('Error') == -1) ? true : false;
            result.message = 'performed';
            result.resources = body;
            debug('sparqlUpdate() result = ', result);
            if (callback) { callback(result); }
          }
        }
      });

      
    } catch (error) {
      result.message = error.toString();
      debug('sparqlUpdate() result = ', result);
      if (callback) { callback(result); }
    }
  }

  getRouter() {
    return this.router;
  }
}

module.exports = FusekiAPI;
