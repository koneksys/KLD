'use strict'

let debug = require('debug')('ServerBootstrap'),
  http = require('http'),
  https = require('https'),
  fs = require('fs'),
  async = require('async'),
  express = require('express'),
  expressJSOptions,
  cors = require('cors'),
  mongoose = require('mongoose'),
  bodyParser = require('body-parser'),
  multer  = require('multer'),
  compression = require('compression'),
  app = express(),
  assert = require('assert'),
  jwt = require('jsonwebtoken'),
  dotenv = require('dotenv'),
  AvailabilityAPI = require('./api/availability'),
  availabilityAPIInstance = new AvailabilityAPI(),
  FusekiAPI = require('./api/fuseki'),
  fusekiAPIInstance = new FusekiAPI(),
  SolrAPI = require('./api/solr'),
  solrAPIInstance = new SolrAPI(),
  ProvisioningAPI = require('./api/provisioning'),
  provisioningAPIInstance = new ProvisioningAPI(),
  UserAPI = require('./api/user'),
  userAPIInstance = new UserAPI(),
  DatasetAPI = require('./api/dataset'),
  datasetAPIInstance = new DatasetAPI(),
  OrganizationAPI = require('./api/organization'),
  organizationAPIInstance = new OrganizationAPI(),
  SecurityAPI = require('./api/security'),
  secruityAPIInstance = new SecurityAPI(),
  EmailAPI = require('./api/email'),
  emailAPIInstance = new EmailAPI(),
  conf = require('./conf/conf'),
  upload = multer({dest: conf.uploadDir}),
  port,
  apiServerId,
  acceptClients,
  dbConnections = {},
  failedDbConnections = [],
  User = require('./model/user'),
  UserModel,
  testUser,
  EmailService = require('./service/email.service'),
  emailServiceInstance = new EmailService(),
  ImportFileService = require('./service/import.file.service'),
  importFileServiceInstance = new ImportFileService(),
  MiddlewareService = require('./service/middleware.service'),
  middlewareServiceInstance = new MiddlewareService(),
  RdfXmlService = require('./service/rdfxml.service'),
  N3Service = require('./service/n3.service'),
  CsvService = require('./service/csv.service'),
  JsonLdService = require('./service/jsonld.service');


class ServerDefault {

  constructor() {
    dotenv.load();
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    global.env = process.env.environment
    debug('global.env = ', global.env)

    if (global.env !== 'local' &&
        global.env !== 'newFeatureReview' &&
        global.env !== 'productionMirror' &&
        global.env !== 'production') {
      debug('.env file must contain  environment = local | newFeatureReview | productionMirror | production')
      debug('.env will define environment = local')
      global.env = 'local'; 
    }

    https.globalAgent.maxSockets = Infinity
    process.stdin.resume();
    function exitHandler(options, err) {
      if (options.cleanup) {
        debug('exitHandler clean')
        debug('close all db connections')
        mongoose.connection.close()
      }
      if (err) {
        debug('exitHandler error')
        debug(err.stack)
      }
      if (options.exit) {
        debug('exitHandler exit')
        process.exit()
      }
    }
    process.on('exit', exitHandler.bind(null,{cleanup:true}))
    process.on('SIGINT', exitHandler.bind(null, {exit:true}))
    process.on('uncaughtException', exitHandler.bind(null, {exit:true}))

    async.waterfall([
      function(callback) {
        global.testDbUrlsResult = []
        global.dbUrls = []
        acceptClients = Object.keys(conf.acceptedClients)
        debug('TEST DATABASE CONNECTIONS ClientIDs=',acceptClients)

        async.forEachOf(acceptClients, function (clientId, index, asyncCallback) {
          dbConnections[clientId] = mongoose.createConnection()
          global.dbUrls[clientId] = conf.acceptedClients[clientId].dbUrl[global.env]
          dbConnections[clientId].open(global.dbUrls[clientId],conf.mongooseOptions).then(function (){
            testDbUrlsResult.push('SUCCESS! client=' + clientId + ', dbUrl.local=' + global.dbUrls[clientId])
            dbConnections[clientId].close()
            asyncCallback()
          })
          dbConnections[clientId].on('error', function (err) {
            console.log('err', err)
            testDbUrlsResult.push('WANRING! ' + err.message + ' client=' + clientId + ', dbUrl.local=' + global.dbUrls[clientId])
            dbConnections[clientId].close()
          })
        }, function (err) {
          callback()
        })
      },
      function(callback) {

        debug('global.testDbUrlsResult', JSON.stringify(global.testDbUrlsResult, null,4))

        app.use(cors())
        app.use(compression())
        app.use(bodyParser.json({limit: conf.limitJSONPostData}))
        app.use(bodyParser.urlencoded({extended: true}))

        let apiRoutes = express.Router() 
        apiRoutes.use(function(req, res, next) {
          let token = req.body.token || req.query.token || req.headers['x-access-token'] || req.headers['token']

          if (token) {
            jwt.verify(token, conf.serverToken, function(err, decoded) {
              if (err) {
                return res.json({ success: false, message: 'Failed to authenticate token.' })
              } else {
                req.decoded = decoded
                next()
              }
            })
          } else {
            return res.status(403).send({
              success: false,
              message: 'No token provided.'
            })
          }
        })

        app.get('/ping', function(req, res) {
          res.send(200, {text: 'OK'})
        })
        app.use('/api', apiRoutes);
        app.use('/security/', secruityAPIInstance.getRouter());
        app.use('/organization/', organizationAPIInstance.getRouter());
        app.use('/api/fuseki/', fusekiAPIInstance.getRouter());
        app.use('/api/solr/', solrAPIInstance.getRouter());
        app.use('/api/provisioning/', provisioningAPIInstance.getRouter());
        app.use('/api/user/', userAPIInstance.getRouter());
        app.use('/api/dataset/', datasetAPIInstance.getRouter());
        app.use('/api/email/', emailAPIInstance.getRouter());

        app.post('/api/file.upload',  upload.single('file'), function (req, res, next) {
          let file = req.file,
            clientId = req.headers['client-id'],
            profile = req.headers.profile,
            rdfXmlServiceInstance = new RdfXmlService(),
            n3ServiceInstance = new N3Service(),
            csvServiceInstance = new CsvService(),
            jsonLdServiceInstance = new JsonLdService(),
            fileExtension,
            result = {
              success: false,
              message: '',
              file: file
            }

          /* { 
            fieldname: 'file',
            originalname: 'importOSLCResource.tar.gz',
            encoding: '7bit',
            mimetype: 'application/x-gzip',
            destination: 'uploads/',
            filename: '2a0e4bb47b10ed8266d9c6eb854a7024',
            path: 'uploads/2a0e4bb47b10ed8266d9c6eb854a7024',
            size: 422237 
          }
          */
          debug('POST /file.upload/ file = ', file.originalname)
          fileExtension = file.originalname.split('.').pop()
          if (fileExtension !== undefined) {
            if(fileExtension.toLowerCase() === 'json' ||
                fileExtension.toLowerCase() === 'rdf' ||
                fileExtension.toLowerCase() === 'ttl' ||
                fileExtension.toLowerCase() === 'csv') {
              fs.readFile(file.path, function (readFileErr, data) {
                let fileContent

                if (readFileErr) {
                  result.format = fileExtension;
                  result.message = file.originalname + '(' + file.filename  + ') file not found';
                  debug('\treturnData = ', JSON.stringify(result, null ,2));
                  res.json(result);
                } else {
                  fileContent = data.toString()

                  debug('\tCheck importFileProcessor settings');
                  if (fileExtension.toLowerCase() === 'json' &&
                      conf.acceptedClients[clientId].importFileProcessor.acceptedFormats['jsonld'] !== undefined &&
                      conf.acceptedClients[clientId].importFileProcessor.acceptedFormats['jsonld'] === true ) {
                    jsonLdServiceInstance.validate(fileContent, function (jsonldResult) {
                      debug('\tCheck with JSONLD : ' + file.originalname, jsonldResult.success)
                      if (jsonldResult.success) {
                        result.success = true
                        result.format = 'jsonld'
                        result.message = 'jsonld uploaded'
                        result.file = file
                        debug('\t returnData = ', JSON.stringify(result, null ,2))
                        res.json(result);
                      } else {
                        result.format = fileExtension
                        result.message = jsonldResult.message
                        result.file = file
                        debug('\treturnData = ', JSON.stringify(result, null ,2))
                        res.json(result);
                      }
                    })
                  } else if (fileExtension.toLowerCase() === 'rdf' &&
                              conf.acceptedClients[clientId].importFileProcessor.acceptedFormats['rdfxml'] !== undefined &&
                              conf.acceptedClients[clientId].importFileProcessor.acceptedFormats['rdfxml'] === true ) {
                    rdfXmlServiceInstance.validate(fileContent, function (rdfResult) {
                      debug('\tCheck with RDFXML : ' + file.originalname, rdfResult.success);
                      if (rdfResult.success) {
                        result.success = true
                        result.format = 'rdf'
                        result.message = 'rdf uploaded'
                        result.file = file
                        debug('\t', result)
                        res.json(result)
                      } else {
                        result.format = fileExtension
                        result.message = rdfResult.message
                        debug('\treturnData = ', JSON.stringify(result, null ,2))
                        res.json(result)
                      }
                    })
                  } else if (fileExtension.toLowerCase() === 'ttl' &&
                              conf.acceptedClients[clientId].importFileProcessor.acceptedFormats['n3'] !== undefined &&
                              conf.acceptedClients[clientId].importFileProcessor.acceptedFormats['n3'] === true ) {
                    n3ServiceInstance.validate(fileContent, function (n3Result) {
                      debug('\tCheck with N3 : ' + file.originalname, n3Result.success)
                      if (n3Result.success) {
                        result.success = true;
                        result.format = 'n3';
                        result.message = 'n3 uploaded';
                        result.file = file;
                        debug('\t', result);
                        res.json(result);
                      } else {
                        result.format = fileExtension
                        result.message = n3Result.message
                        debug('\treturnData = ', JSON.stringify(result, null ,2))
                        res.json(result)
                      }
                    })
                  } else if (fileExtension.toLowerCase() === 'csv' &&
                              conf.acceptedClients[clientId].importFileProcessor.acceptedFormats['csv'] !== undefined &&
                              conf.acceptedClients[clientId].importFileProcessor.acceptedFormats['csv'] === true ) {
                    csvServiceInstance.validate(fileContent, function (csvResult) {
                      debug('\t3. Check with CSV : ' + file.originalname, csvResult.success)
                      if (csvResult.success) {
                        result.success = true;
                        result.format = 'csv';
                        result.message = 'csv uploaded';
                        result.file = file;
                        debug('\t', result);
                        res.json(result);
                      } else {
                        result.format = fileExtension
                        result.message = csvResult.message
                        debug('\treturnData = ', JSON.stringify(result, null ,2))
                        res.json(result)
                      }
                    })
                  } else {
                    result.format = fileExtension
                    result.message = fileExtension + ' is not supported'
                    debug('\treturnData = ', JSON.stringify(result, null ,2))
                    res.json(result)
                  }
                }
              })
            } else {
              result.format = fileExtension;
              result.message = '.' + fileExtension + ' is not supported';
              debug('\t returnData = ', JSON.stringify(result, null ,2));
              res.json(result);
            }
          } else {
            result.format = 'file extension required';
            result.message = 'file extension required';
            debug('\t returnData = ', JSON.stringify(result, null ,2));
            res.json(result);
          }
        })

        app.post('/file.download', function (req, res, next) {
          let file = req.body.file,
            clientId = req.body.clientId,
            profile = req.body.profile

          /* { 
            fieldname: 'file',
            originalname: 'importOSLCResource.tar.gz',
            encoding: '7bit',
            mimetype: 'application/x-gzip',
            destination: 'uploads/',
            filename: '2a0e4bb47b10ed8266d9c6eb854a7024',
            path: 'uploads/2a0e4bb47b10ed8266d9c6eb854a7024',
            size: 422237 
          }
          */
          console.log('POST /file.download file = ', file);
          fs.readFile(file.path, function (err, data) {
            let fileContent;

            if (err) {
              res.json({success: false, message: err.toString()});
            } else {
              fileContent = data.toString();
              res.json({success: true, message: 'uploaded', content: fileContent});
            }
          });
        })


        callback()
      },
      function(callback) {

        /*
        if (!fs.existsSync(conf.sslKey)) {
          callback('not found ' + conf.sslKey);
        }

        if (!fs.existsSync(conf.sslCert)) {
          callback('not found ' + conf.sslCert);
        }

        expressJSOptions = {
          key: fs.readFileSync(conf.sslKey),
          cert: fs.readFileSync(conf.sslCert)
        } 
        */

        /*********************** API SERVER *************************/
        port = conf.port
        apiServerId = process.env.KLD_API_ID || conf.apiServerId
        debug('port = ', port)
        debug('apiServerId = ', apiServerId)
        debug('sslKey = ', conf.sslKey)
        debug('sslCert = ', conf.sslCert)

        callback()
      }
    ],
    function(err, result) {
      if (err) throw err

      // https.createServer(expressJSOptions, app).listen(port, function(){
      http.createServer(app).listen(port, function(){
        console.log("API Server listening on SSL port https://localhost:" + port);
      })

    })

  }
}

module.exports = ServerDefault









