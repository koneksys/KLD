'use strict';

let fs = require('fs'),
  debug = require('debug')('GeneratorLib'),
  lineReader = require('line-reader'),
  childProcess = require('child_process'),
  spawn = childProcess.spawn,
  walk = require('walk'),
  querystring = require('querystring'),
  request = require('request'),
  Runner = require('./runner'),
  RDFParser = require('./rdfparser'),
  conf = require('../conf/conf'),
  IO = require('./io'),
  dateFormater = require('dateformat');

/**
 * Generator class
 * @author Vorachet Jaroensawas <vorachet.jaroensawas@koneksys.com>
 */
class Generator {
  constructor() {
    this.rdfParser = new RDFParser();
    this.runner = new Runner();
    this.io = new IO();
    this.stdPrefixes = {
      tdb: 'http://jena.hpl.hp.com/2008/tdb#',
      ja: 'http://jena.hpl.hp.com/2005/11/Assembler#',
      text: 'http://jena.apache.org/text#',
      fuseki: 'http://jena.apache.org/fuseki#',
      rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
      rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
      owl: 'http://www.w3.org/2002/07/owl#'
    }
  }

  /**
   * deleteProvisioning
   * @param  {string}   provisioning 
   * @param  {Function} callback - {
        success: true|false,
        message: ''
      }
   */
  deleteProvisioning(provisioning, callback) {
    let self = this,
      provisioningContent,
      provisioningJSON,
      result = {
        success: false,
        message: ''
      };

    this.io.readProvisioningJSONOrFilePath(provisioning, function (verResult) {
      if (verResult.success) {
        provisioningJSON = verResult.json;
        self.io.deleteDirectoryRecursively(provisioningJSON.provisioning.dbPath + '/profiles/' + provisioningJSON.provisioning.name + '*');
        result.success = true;
        result.message = 'Provisioning files of ' + provisioningJSON.provisioning.name + ' have been deleted!';
        debug(result.message);
        if (callback) { callback(result); }
      } else {
        if (callback) { callback(verResult); }
      }
    });
  }

  /**
   * deleteSolrCores
   * @param  {string}   provisioning 
   * @param  {Function} callback - {
        success: true|false,
        message: ''
      }
   */
  deleteSolrCores(provisioning, callback) {
    let self = this,
      provisioningContent,
      provisioningJSON,
      organizations,
      organizationJson,
      spawnInstance,
      cores = '',
      result = {
        success: false,
        message: ''
      };

    this.io.readProvisioningJSONOrFilePath(provisioning, function (verResult) {
      if (verResult.success) {
        provisioningJSON = verResult.json;
        organizations = Object.keys(provisioningJSON.provisioning.organizations);
        organizations.forEach(function(organization) {
          cores += organization + ' ';
          organizationJson = provisioningJSON.provisioning.organizations[organization];
            spawnInstance = spawn('./solr/bin/solr', ['delete', '-c', organization]);
            spawnInstance.stdout.on('data', function(data) {
              debug('spawn.stdout: ', data.toString());
            });
            spawnInstance.stderr.on('data', function(data) {
              debug('stderr.on: ',  data.toString());
            });
            spawnInstance.on('close', function(code) {
              debug('spawn exit code: ', code);
              result.success = true;
              result.message = 'CORE(' + cores + ') have been deleted!';
              debug(result.message);
              if (callback) { callback(result); }
            });
        });
      } else {
        if (callback) { callback(verResult); }
      }
    });
  }

  /**
   * deleteFusekiTdbs
   * @param  {string}   provisioning 
   * @param  {Function} callback - {
        success: true|false,
        message: ''
      }
   */
  deleteFusekiTdbs(provisioning, callback) {
    let self = this,
      provisioningContent,
      provisioningJSON,
      organizations,
      fusekiWorkspace,
      fusekiTdbDir,
      tdbs = '',
      result = {
        success: false,
        message: ''
      };

    this.io.readProvisioningJSONOrFilePath(provisioning, function (verResult) {
      if (verResult.success) {
        provisioningJSON = verResult.json;
        fusekiWorkspace = provisioningJSON.provisioning.dbPath + '/FUSEKI_' + provisioningJSON.provisioning.name;
        self.io.deleteDirectoryRecursively(fusekiWorkspace);
        self.io.deleteDirectoryRecursively(fusekiWorkspace + 'Infer');
        self.io.deleteDirectoryRecursively(fusekiWorkspace + 'Fulltext');
        organizations = Object.keys(provisioningJSON.provisioning.organizations);
        result.success = true;
        result.message = 'TDB(' + organizations + '): have been deleted!';
        debug(result.message);
        if (callback) { callback(result); }
      } else {
        if (callback) { callback(verResult); }
      }
    });
  }

  /**
   * generateDataPatchFromDir
   * @param  {string}   organization
   * @param  {string}   rdfDir    
   * @param  {string}   format    
   * @param  {string}   outputDir 
   * @param  {Function} callback - {
        success: true|false,
        message: '',
        patch: {}
      }
   */
  generateDataPatchFromDir(organization, rdfDir, format, outputDir, callback) {
    let self = this,
      walker  = walk.walk(rdfDir , { followLinks: false }),
      files = [],
      result = {
        success: false,
        message: '',
        generatedDataPatchDir: ''
      },
      theFile;

    debug('generateDataPatchFromDir() organization = ', organization);
    debug('generateDataPatchFromDir() rdfDir = ', rdfDir);
    debug('generateDataPatchFromDir() format = ', format);
    debug('generateDataPatchFromDir() outputDir = ', outputDir);

    function mycall() {
      theFile = files.shift();
      debug('generateDataPatchFromDir() theFile = ', theFile);
      self.generateDataPatch(organization, theFile, format, outputDir, function (result) {
        if (result.success) {
          debug('generateDataPatchFromDir() added data patch: ' + theFile, result.success);
          if (files.length === 0) {
            result.success =  true;
            result.message = 'generateDataPatchFromDir() All data patches added';
            result.generatedDataPatchDir = outputDir;
            debug('generateDataPatchFromDir() result = ', result.message);
            if (callback) { callback(result); }
          } else {
             mycall();
           }
        } else {
          result.message = result.message;
          debug('generateDataPatchFromDir() err result = ', result.message);
          if (callback) { callback(result); }
        }
      }); 
    }

    walker.on('file', function(root, stat, next) {
      debug('generateDataPatchFromDir() stat = ', stat);
      if (stat.name.match('.rdf')) {
        debug('generateDataPatchFromDir() stat.name.match(.rdf)', stat.name.match('.rdf'));
        files.push(root + stat.name);
      } 
      next();
    });

    walker.on('end', function() {
      if (files.length === 0) {
        result.message = 'File not found';
        if (callback) { callback(result); }
      } else {
        mycall();
      }
    });
  }


  validText(text) {
    text = text.replace(/\'/g,'');
    text = text.replace(/\"/g,'');
    text = text.replace(/\`/g,'');
    text = text.replace(/\\/g,'');
    text = text.replace(/\r?\n|\r/g, '');
    return text;
  }

  validURL(text) {
    text = this.validText(text) 
    text = text.replace(/ /g,'%20');
    return text;
  }
  /**
   * generateDataPatch
   * @param  {string}   organization
   * @param  {string}   rdfxml    
   * @param  {string}   format 
   * @param  {string}   outputDir 
   * @param  {Function} callback - {
        success: true|false,
        message: '',
        patch: {}
      }
   */
  generateDataPatch(organization, rdfxml, format, outputDir, callback) {
    let self = this,
      patch = {
          "provisioning": {
            "organizations": {}
          }
        },
      rdfxmlContent,
      patchFormat,
      patchMode,
      organizationJson,
      dataPatchFilename = rdfxml.split('/').pop(),
      jsonFileContent = '',
      jsonFilePath,
      csvDataPatchFileContent = '',
      csvDataPatchFilePath,
      csvDataPatchDelimiter = ',',
      result = {
        success: false,
        patch: {},
        message: ''
      };

    debug('generateDataPatch() organization =' , organization);
    debug('generateDataPatch() rdfxml =' , rdfxml);
    debug('generateDataPatch() format =' , format);
    debug('generateDataPatch() outputDir =' , outputDir);

    if (organization === undefined || organization === '') {
      organization = 'unnamedOrg';
    }

    if (format.split(':').length != 2) {
      result.message = 'Format must be <format>:<mode> form. Available formats: "json:insert", "json:delete", "csv:insert", "csv:delete", "all:insert", "all:delete"';
      debug(result.message);
      if (callback) { callback(result) };
    } else {
      patchFormat = format.split(':')[0];
      patchMode = format.split(':')[1];

      if (patchFormat !== 'json' && patchFormat !== 'csv' && patchFormat !== 'all') {
        result.message = 'With <format>:<mode>, The value of <format> must be "json" or "csv" or "all"';
        debug(result.message);
        if (callback) { callback(result) };

      } else if (patchMode !== 'insert' && patchMode !== 'delete') {
        result.message = 'With <format>:<mode>, The value of <mode> must be "insert" or "delete"';
        debug(result.message);
        if (callback) { callback(result) };

      } else {
        patch.provisioning.organizations[organization] = {
          "prefixes": {},
          "maps": {}
        };

        fs.exists(rdfxml, function (exists) {
          if (exists) {
            rdfxmlContent = fs.readFileSync(rdfxml).toString();
            self.rdfParser.parseRDFXML(rdfxmlContent, function (parseResult) {
              if (parseResult.success) {
                parseResult.triples.forEach(function (triple) {

                  organizationJson = patch.provisioning.organizations[organization];
                  if (organizationJson.triples === undefined) { organizationJson.triples = []; }

                  triple.subject.uri = self.validURL(triple.subject.uri);
                  triple.predicate.uri = self.validURL(triple.predicate.uri);

                  if (triple.object.isUri) {
                    triple.object.value = self.validURL(triple.object.value);
                    csvDataPatchFileContent += organization + csvDataPatchDelimiter + patchMode + csvDataPatchDelimiter + '<' + triple.subject.uri + '>' + csvDataPatchDelimiter +
                                    '<' + triple.predicate.uri + '>' + csvDataPatchDelimiter +
                                    '<' + triple.object.value + '>\n';
                  } else {
                    triple.object.value = self.validText(triple.object.value);
                    csvDataPatchFileContent += organization + csvDataPatchDelimiter + patchMode + csvDataPatchDelimiter + '<' + triple.subject.uri + '>' + csvDataPatchDelimiter +
                                    '<' + triple.predicate.uri + '>' + csvDataPatchDelimiter +
                                    '"' + triple.object.value + '"^^<http://www.w3.org/1999/02/22-rdf-syntax-ns#XMLLiteral>\n';
                  }
                  triple.operation = patchMode;
                  organizationJson.triples.push(triple);
                });

                csvDataPatchFilePath = outputDir + '/' + organization + '.data.patch.csv';

                if(outputDir) {
                  debug('specified outputDir = ', outputDir);
                  // specified outputDir
                  fs.exists(outputDir, function (exists) {
                    if (!exists) {
                      debug('outputDir ' + outputDir + ' does not exist');
                      fs.mkdirSync(outputDir);
                      debug('outputDir ' + outputDir + ' has been created');
                    }

                    jsonFilePath = outputDir + '/' + dataPatchFilename + '.datapatch';
                    result.patch = patch;
                    jsonFileContent = JSON.stringify(result.patch, null, 2);

                    if (patchFormat === 'json') {
                      self.io.writeFile(jsonFilePath, jsonFileContent, '755');
                      debug('json file = ' + jsonFilePath + ' is generated');
                    } else if (patchFormat === 'csv') {
                      self.io.writeFile(csvDataPatchFilePath, csvDataPatchFileContent, '755');
                      debug('csv file = ' + csvDataPatchFilePath + ' is generated');
                    } else {
                      self.io.writeFile(jsonFilePath, jsonFileContent, '755');
                      debug('json file = ' + jsonFilePath + ' is generated');
                    }
                    result.success = true;
                    result.message = 'Data patch generated';
                    debug(result.message);
                    if(callback) { callback(result) };
                  });
                } else {
                  debug('specified outputDir not found');
                  // did not specify outputDir
                  result.success = true;
                  result.patch = patch;
                  result.message = 'Data patch generated';
                  self.printDataPatch(patchFormat, {
                    patch: result.patch,
                    csvDataPatchFileContent: csvDataPatchFileContent
                  });
                  if(callback) { callback(result) };
                }
                
              } else {
                result.message = parseResult.message;
                debug(result.message);
                if (callback) { callback(result) };
              }
            });
          } else {
            result.message = 'RDFXML: ' + rdfxml + ' does not exist.';
            debug(result.message);
            if (callback) { callback(result) };
          }
        });

      }
    }
  }

  printDataPatch(format, data) {
    debug('printDataPatch() format = ', format);
    if (format) {
      if (format === 'json') {
        debug(JSON.stringify(data.patch, null, 2));
      } else if (format === 'csv') {
        debug(data.csvDataPatchFileContent);
      } else {
        debug(JSON.stringify(data.patch, null, 2));
        debug(data.csvDataPatchFileContent);
      }
    } else {
      debug(JSON.stringify(data.patch, null, 2));
    }
  }

  /**
   * generateConfPatchFromDir
   * @param  {string}   organization
   * @param  {string}   rdfDir    
   * @param  {string}   outputDir 
   * @param  {Function} callback - {
        success: true|false,
        message: '',
        patch: {}
      }
   */
  generateConfPatchFromDir(organization, rdfDir, outputDir, callback) {
    let self = this,
      walker  = walk.walk(rdfDir , { followLinks: false }),
      files = [],
      writingGraphName,
      patchFileName,
      result = {
        success: false,
        message: ''
      },
      theFile;

    debug('generateConfPatchFromDir() organization = ', organization);
    debug('generateConfPatchFromDir() rdfDir = ', rdfDir);
    debug('generateConfPatchFromDir() outputDir = ', outputDir);

    function mycall() {
      theFile = files.shift();
      debug('start call theFile = ', theFile);
      patchFileName = theFile.split('/').pop();
      writingGraphName = organization + ';' + patchFileName;
      self.generateConfPatch(writingGraphName, theFile, outputDir, function (result) {
        if (result.success) {
          debug('added data patch: ' + theFile, result.success);
          if (files.length === 0) {
            result.success =  true;
            result.message = 'All conf patches added';
            debug('generateConfPatchFromDir() result = ', result);
            if (callback) { callback(result); }
          } else {
             mycall();
           }
        } else {
          result.message = result.message;
          debug('generateConfPatchFromDir() result = ', result);
          if (callback) { callback(result); }
        }
      }); 
    }

    walker.on('file', function(root, stat, next) {
      if (stat.name.match('.rdf')) {
        files.push(root + stat.name);
      }
      next();
    });

    walker.on('end', function() {
      if (files.length === 0) {
        result.message = 'File not found';
        if (callback) { callback(result); }
      } else {
        mycall();
      }
    });
  }


  /**
   * generateConfPatch
   * @param  {string}   organization
   * @param  {string}   rdfxml    
   * @param  {string}   outputDir 
   * @param  {Function} callback - {
        success: true|false,
        message: '',
        patch: {}
      }
   */
  generateConfPatch(organization, rdfxml, outputDir, callback) {
    let self = this,
      patch = {
          "provisioning": {
            "organizations": {}
          }
        },
      rdfxmlContent,
      prefixesMap = [],
      prefixesMapKeys,
      replacedPredicate,
      solrField,
      predicate,
      outputFileContent,
      outputFilePath,
      writingOrganizationName,
      writingPatchFile,
      result = {
        success: false,
        patch: {},
        message: ''
      };

    if (organization === undefined || organization === '') {
      writingOrganizationName = 'unnamedGraph';
      writingPatchFile = 'unnamedPathcFile';
    }

    if (organization.split(';').length <= 1) {
      writingOrganizationName = organization;
      writingPatchFile = 'unnamedPathcFile';
    } else {
      writingOrganizationName = organization.split(';')[0];
      writingPatchFile = organization.split(';')[1];
      writingPatchFile = writingPatchFile.replace('.rdf', '');
    }

    patch.provisioning.organizations[writingOrganizationName] = {
      "prefixes": {},
      "maps": {}
    };

    fs.exists(rdfxml, function (exists) {
      if (exists) {
        rdfxmlContent = fs.readFileSync(rdfxml).toString();
        self.rdfParser.parseRDFXML(rdfxmlContent, function (parseResult) {
          if (parseResult.success) {
            parseResult.prefixes.forEach(function (prefix) {
              prefixesMap[prefix.prefix] = prefix.uri;
              patch.provisioning.organizations[writingOrganizationName].prefixes[prefix.prefix] = prefix.uri;
            });
            prefixesMapKeys = Object.keys(prefixesMap);
            parseResult.distinctPredicates.forEach(function (distinctPredicate) {
              prefixesMapKeys.forEach(function (prefixesMapKey) {
                replacedPredicate = distinctPredicate.replace(prefixesMap[prefixesMapKey], '');
                if (replacedPredicate !== distinctPredicate) {
                  solrField = 'p_' + prefixesMapKey + '.' + replacedPredicate;
                  predicate = prefixesMapKey + ':' + replacedPredicate;
                  if (!(solrField.indexOf('/') > -1)) {
                    if (solrField.indexOf('#') > -1) {
                      solrField = solrField.replace('#', '');
                      predicate = predicate.replace('#', '');
                      patch.provisioning.organizations[writingOrganizationName].maps[solrField] = predicate;
                    } else {
                      patch.provisioning.organizations[writingOrganizationName].maps[solrField] = predicate;
                    }
                  }
                }
              });
            });

            if(outputDir) {
              // specified outputDir
              fs.exists(outputDir, function (exists) {
                if (!exists) {
                  result.message = 'outputDir=' + outputDir + ' does not exist!';
                  debug(result.message);
                  if (callback) { callback(result) };
                } else {
                  outputFilePath = outputDir + '/' + writingPatchFile + '.confpatch';
                  result.patch = patch;
                  outputFileContent = JSON.stringify(result.patch, null, 2);
                  self.io.writeFile(outputFilePath, outputFileContent, '755', function (writeFileResult) {
                    if (writeFileResult.success) {
                      result.success = true;
                      result.message = 'Config patched';
                      debug(result.message);
                      if (callback) { callback(result) };
                    } else {
                      result.message = writeFileResult.message;
                      debug(result.message);
                      if (callback) { callback(result) };
                    }
                  });

                }
              });
            } else {
              // did not specify outputDir
              result.success = true;
              result.patch = patch;
              result.message = 'Config patched';
              debug(JSON.stringify(result.patch, null, 2));
              if(callback) { callback(result) };
            }
            
          } else {
            result.message = parseResult.message;
            debug(result.message);
            if (callback) { callback(result) };
          }
        });
      } else {
        result.message = rdfxml + ' does not exist.';
        debug(result.message);
        if (callback) { callback(result) };
      }
    });
  }


  /**
   * addConfPatchFromDir
   * @param  {string}   provisioning
   * @param  {string}   patchDir 
   * @param  {Function} callback - {
        success: true|false,
        message: ''
      }
   */
  addConfPatchFromDir(provisioning, patchDir, callback) {
    let self = this,
      walker  = walk.walk(patchDir , { followLinks: false }),
      files = [],
      count = 0,
      result = {
        success: false,
        message: ''
      },
      theFile;

    function mycall() {
      theFile = files.shift();

      count++;
      debug('start call(' + count + ') theFile = ', theFile);
      self.addConfPatch(provisioning, theFile, function (result) {
        if (result.success) {
          debug('added conf patch: ' + theFile, result.success);
          if (files.length === 0) {
            result.success =  true;
            result.message = 'all conf patches added';
            if (callback) { callback(result); }
          } else {
             mycall();
           }
        } else {
          result.message = result.message;
          if (callback) { callback(result); }
        }
      }); 
    }

    walker.on('file', function(root, stat, next) {
      if (stat.name.match('.confpatch')) {
        files.push(root + stat.name);
      }
      next();
    });

    walker.on('end', function() {
      if (files.length === 0) {
        result.message = 'File not found';
        if (callback) { callback(result); }
      } else {
        mycall();
      }
    });
  }

  /**
   * addConfPatch
   * @param  {string}   provisioning
   * @param  {string}   patch 
   * @param  {Function} callback - {
        success: true|false,
        message: ''
      }
   */
  addConfPatch(provisioning, patch, callback) {
    let self = this,
      uuid = this.io.generateUUID(),
      provisioningContent,
      provisioningJson,
      patchContent,
      patchJson,
      profileFusekiConfTTLFilePath,
      profileProvisioningFilePath,
      profileProvisioningContent,
      profileProvisioningJSON,
      result = {
        success: false,
        message: ''
      };

    this.io.readProvisioningJSONOrFilePath(provisioning, function (verResult1) {
      if (verResult1.success) {
        provisioningJson = verResult1.json;
        self.io.readConfPatchJSONOrFilePath(patch, function (verResult2) {
          if (verResult2.success) {
            patchJson = verResult2.json;
            profileFusekiConfTTLFilePath = provisioningJson.provisioning.dbPath + '/profiles/' + provisioningJson.provisioning.name + '.fuseki.conf.ttl';
            fs.exists(profileFusekiConfTTLFilePath, function (exists) {
              if (exists) {
                  profileProvisioningFilePath = provisioningJson.provisioning.dbPath + '/profiles/' + provisioningJson.provisioning.name + '.provisioning.json';
                  fs.exists(profileProvisioningFilePath, function (exists) {
                    if (exists) {
                      fs.readFile(profileProvisioningFilePath, function(err, data) {
                        profileProvisioningContent = data.toString();
                        setTimeout(function() {
                          debug('CHECK: provisioning =', provisioning);
                          debug('CHECK: profileProvisioningFilePath = ', profileProvisioningFilePath);
                          debug('CHECK: profileProvisioningContent = ', profileProvisioningContent);
                          if (self.io.validateJson(profileProvisioningContent)) {
                            profileProvisioningJSON = JSON.parse(profileProvisioningContent);
                            self.backupOriginalFusekiConfTTLFile(provisioningJson, uuid, profileFusekiConfTTLFilePath, profileProvisioningFilePath);
                            self.mergePatchDataIntoProvisoning(
                              profileFusekiConfTTLFilePath,
                              profileProvisioningFilePath,
                              profileProvisioningJSON,
                              patchJson,
                              function (processedProvisioningJSON, duplication) {
                                /*
                                self.addPatchIntoExistingProvisioningFile(
                                  uuid,
                                  processedProvisioningJSON,
                                  patch,
                                  patchJson,
                                  duplication,
                                  function () {
                                    debug('Patched!');
                                  }
                                );
                                */
                               result.success = true;
                               if (callback) { callback(result); }
                              }
                            );
                          } else {
                            result.message = 'profileProvisioning=' + profileProvisioningFilePath +' is not a valid JSON!';
                            debug(result.message);
                            if (callback) { callback(result); }
                          }
                        }, 200);
                        
                      });
                    } else {
                      result.message = 'profileProvisioning=' + profileProvisioning +' does not exist!';
                      debug(result.message);
                      if (callback) { callback(result); }
                    }
                  });
              } else {
                result.message = 'profileFusekiConfTTL=' + profileFusekiConfTTLFilePath +' does not exist!';
                debug(result.message);
                if (callback) { callback(result); }
              }
            });
          } else {
            debug(verResult2.message);
            if (callback) { callback(verResult2); }
          }
        });
      } else {
        debug(verResult1.message);
        if (callback) { callback(verResult1); }
      }
    });
  }

    /**
   * addDataPatchFromDir
   * @param  {string}   provisioning
   * @param  {string}   generatedDataPatchDir 
   * @param  {string}   format 
   * @param  {string}   datasetIdentifier 
   * @param  {string}   fusekiUpdateUrl 
   * @param  {Function} callback - {
        success: true|false,
        message: ''
      }
   */
  addDataPatchFromDir(provisioning, generatedDataPatchDir,format, datasetIdentifier, fusekiUpdateUrl, callback) {
    let self = this,
      walker  = walk.walk(generatedDataPatchDir , { followLinks: false }),
      files = [],
      exceedMaxImportTriples = false,
      result = {
        success: false,
        message: '',
        patchedStmts: [],
        exceedMaxImportTriples: false
      },
      theFile;

    debug('addDataPatchFromDir() provisioning= ', provisioning);
    debug('addDataPatchFromDir() generatedDataPatchDir= ', generatedDataPatchDir);
    debug('addDataPatchFromDir() format= ', format);

    function syncall() {
      debug('addDataPatchFromDir syncall();');
      theFile = files.shift();
      debug('addDataPatchFromDir() start call() theFile = ', theFile);
      self.addDataPatch(provisioning, theFile, format, datasetIdentifier, fusekiUpdateUrl, function (addDataResult) {
        if (addDataResult.success) {
          result.patchedStmts.push({
            datasetIdentifier: datasetIdentifier,
            countTriple: addDataResult.countTriple,
            rdfFile: theFile.replace('.datapatch', '').split('/').pop(),
            rdfFilePath: theFile.replace('.datapatch', ''),
            patchFile: theFile,
            patchDate: new Date(),
            rdf: fs.readFileSync(theFile.replace('.datapatch', '')).toString(),
          });
          /*
          rdf: fs.readFileSync(theFile.replace('.datapatch', '')).toString(),
          sparqlUpdateStmt: addDataResult.sparqlUpdateStmt,
          sparqlUpdateStmtRollback: addDataResult.sparqlUpdateStmtRollback
           */
          if (files.length === 0) {
            result.success =  true;
            result.message = 'all data patches added';
            if (callback) { callback(result); }
          } else {
            syncall();
          }
        } else {
          debug('addDataPatchFromDir() Found failure ', addDataResult);
          result.message = addDataResult.message;
          result.exceedMaxImportTriples = addDataResult.exceedMaxImportTriples;
          if (exceedMaxImportTriples) {
            debug('addDataPatchFromDir() Found exceedMaxImportTriples failure ', result);
          }
          if (callback) { callback(result); }
        }
      }); 
    }

    walker.on('file', function(root, stat, next) {
      if (stat.name.match('.datapatch')) {
        files.push(root + stat.name);
      }
      next();
    });

    walker.on('end', function() {
      if (files.length === 0) {
        result.message = 'File not found';
        if (callback) { callback(result); }
      } else {
        syncall();
      }
    });
  }

  /**
   * addDataPatch
   * @param  {string}   provisioning
   * @param  {string}   patch 
   * @param  {string}   format 
   * @param  {string}   datasetIdentifier 
   * @param  {string}   fusekiUpdateUrl 
   * @param  {Function} callback - {
        success: true|false,
        message: ''
      }
   */
  addDataPatch(provisioning, patch, format, datasetIdentifier, fusekiUpdateUrl, callback) {
    let self = this,
      uuid = this.io.generateUUID(),
      patchGraph,
      provisioningContent,
      provisioningJson,
      patchContent,
      patchJson,
      profileFusekiConfTTLFilePath,
      profileProvisioningFilePath,
      profileProvisioningContent,
      profileProvisioningJSON,
      organizations,
      patchMode,
      countTriple = 0,
      rollbackPatchMode,
      sparqlUnderstoodTriple = {
        subject: '',
        predicate: '',
        object: ''
      },
      exceedMaxImportTriples = false,
      sparqlUpdateStmtWithoutGraphName = '',
      sparqlUpdateStmtRollbackWithoutGraphName = '',
      sparqlUpdateStmt = '',
      sparqlUpdateStmtRollback = '',
      csvLine,
      csvLineCount,
      result = {
        success: false,
        message: '',
        countTriple: 0,
        sparqlUpdateStmtWithoutGraphName: {},
        sparqlUpdateStmt: {},
        sparqlUpdateStmtRollback: {},
        exceedMaxImportTriples: false
      },
      provisioningDataPatchedFilePath,
      provisioningDataRollbackFilePath;

    if (format !== 'json' && format !== 'csv') {
      result.message = 'format must be "json" or "csv"';
      debug(result.message);
      if (callback) { callback(result); }
    } else {
      this.io.readProvisioningJSONOrFilePath(provisioning, function (verResult1) {
        if (verResult1.success) {
          provisioningJson = verResult1.json;
          debug('format = ', format);
          if (format == 'json') {
            self.io.readDataPatchOrFilePath(patch, function (verResult2) {
              if (verResult2.success) {
                patchJson = verResult2.data;
                organizations = Object.keys(patchJson.provisioning.organizations);
                organizations.forEach(function(organization) {
                  patchJson.provisioning.organizations[organization].triples.some(function(triple) {
                    debug('patchJson.provisioning.organizations[organization].triples.forEach', triple);

                    if (patchGraph === undefined) {
                      patchGraph = organization;
                    }

                    if (patchMode === undefined) {
                      patchMode = triple.operation;
                      if (patchMode === 'insert') {
                        patchMode = 'insert data '
                        rollbackPatchMode = 'delete data';
                      } else {
                        patchMode = 'delete data '
                        rollbackPatchMode = 'insert data';
                      }
                    }
                    sparqlUnderstoodTriple.subject = '<' + triple.subject.uri + '>';
                    sparqlUnderstoodTriple.predicate = '<' + triple.predicate.uri + '>';
                    if (triple.object.isUri) {
                      sparqlUnderstoodTriple.object = '<' + triple.object.value + '>';
                    } else {
                      sparqlUnderstoodTriple.object = '"' + triple.object.value + '"^^<' + triple.object.literalDataType + '>';
                    }

                    countTriple++;
                    if (countTriple > conf.maxImportTriples) {
                      exceedMaxImportTriples = true;
                      debug('Your exceed maximum length of ' + conf.maxImportTriples + ' triples, Please import with a smaller dataset');
                      result.message = 'Your exceed maximum length of ' + conf.maxImportTriples + ' triples, Please import with a smaller dataset';
                      result.exceedMaxImportTriples = true;
                      callback(result);
                      return true;
                    }

                    sparqlUpdateStmtWithoutGraphName += patchMode + ' { ' +
                      sparqlUnderstoodTriple.subject + ' ' +
                      sparqlUnderstoodTriple.predicate  + ' ' +
                      sparqlUnderstoodTriple.object + ' ' +
                      ' } ; \n';

                    sparqlUpdateStmtRollbackWithoutGraphName += rollbackPatchMode + ' { ' +
                      sparqlUnderstoodTriple.subject + ' ' +
                      sparqlUnderstoodTriple.predicate  + ' ' +
                      sparqlUnderstoodTriple.object + ' ' +
                      ' } ; \n';

                    sparqlUpdateStmt += patchMode + ' { GRAPH <' + datasetIdentifier + '> { ' +
                      sparqlUnderstoodTriple.subject + ' ' +
                      sparqlUnderstoodTriple.predicate  + ' ' +
                      sparqlUnderstoodTriple.object + ' ' +
                      ' } }; \n';
                    sparqlUpdateStmtRollback += rollbackPatchMode + ' { GRAPH <' + datasetIdentifier + '> { ' +
                      sparqlUnderstoodTriple.subject + ' ' +
                      sparqlUnderstoodTriple.predicate  + ' ' +
                      sparqlUnderstoodTriple.object + ' ' +
                      ' } }; \n';
                  });
                });

                debug('exceedMaxImportTriples = ', exceedMaxImportTriples);
                if (exceedMaxImportTriples) {
                } else {
                  self.callSparqlUpdateInfer(fusekiUpdateUrl, sparqlUpdateStmtWithoutGraphName, function (callInferResult) {
                    if (callInferResult.success) {
                      self.callSparqlUpdateFulltext(fusekiUpdateUrl, sparqlUpdateStmt, function (callFulltextResult) {
                        if (callFulltextResult.success) {
                          self.copyDataPathToProvisioningProfile(provisioningJson, sparqlUpdateStmt, sparqlUpdateStmtRollback, function (copyDataPatchResult) {
                            if (callback) { 
                              copyDataPatchResult.countTriple = countTriple;
                              copyDataPatchResult.sparqlUpdateStmtWithoutGraphName = sparqlUpdateStmtWithoutGraphName;
                              copyDataPatchResult.sparqlUpdateStmtRollbackWithoutGraphName = sparqlUpdateStmtRollbackWithoutGraphName;
                              copyDataPatchResult.sparqlUpdateStmt = sparqlUpdateStmt;
                              copyDataPatchResult.sparqlUpdateStmtRollback = sparqlUpdateStmtRollback;
                              callback(copyDataPatchResult);
                            }
                          });
                        } else {
                          if (callback) { callback(callFulltextResult); }
                        }
                      });
                    }
                  });
                }
              } else {
                debug(verResult2.message);
                if (callback) { callback(verResult2); }
              }
            });
          } else {
            // csv
            fs.exists(patch, function (exists) {
              if (exists) {
                csvLineCount = 0;
                lineReader.eachLine(patch, function (line, last) {
                  csvLineCount++;
                  csvLine = line.split(",");
                  if (csvLine.length !== 5) {
                    result.message = 'Line ' + csvLineCount + ': This line is not a valid TTL data patch: ' + line;
                    debug(result.message);
                    if (callback) { callback(result); }
                  } else {
                    if (patchGraph === undefined) {
                      patchGraph = csvLine[0];
                    }

                    if (patchMode === undefined) {
                      patchMode = csvLine[1];
                      if (patchMode === 'insert') {
                        rollbackPatchMode = 'delete';
                      } else {
                        rollbackPatchMode = 'insert';
                      }
                    }

                    sparqlUpdateStmt += patchMode + ' { GRAPH <' + datasetIdentifier + '> { ' +
                      sparqlUnderstoodTriple.subject + ' ' +
                      sparqlUnderstoodTriple.predicate  + ' ' +
                      sparqlUnderstoodTriple.object + ' ' +
                      ' } }; \n';

                    sparqlUpdateStmtRollback += rollbackPatchMode + ' { GRAPH <' + datasetIdentifier + '> { ' +
                      sparqlUnderstoodTriple.subject + ' ' +
                      sparqlUnderstoodTriple.predicate  + ' ' +
                      sparqlUnderstoodTriple.object + ' ' +
                      ' } }; \n';

                    if (last) {
                      self.callSparqlUpdateFulltext(conf.fusekiUrl + '/' + patchGraph + '/update', sparqlUpdateStmt, function (callResult) {
                        if (callResult.success) {
                          self.copyDataPathToProvisioningProfile(provisioningJson, sparqlUpdateStmt, sparqlUpdateStmtRollback, function (copyDataPatchResult) {
                            if (callback) { 
                              copyDataPatchResult.sparqlUpdateStmt = sparqlUpdateStmt;
                              copyDataPatchResult.sparqlUpdateStmtRollback = sparqlUpdateStmtRollback;
                              callback(copyDataPatchResult);
                            }
                          });
                        }
                      });
                    }
                  }
                });
              } else {
                result.message = 'Data patch ' + patch + ' does not exist.';
                if (callback) { callback(result); }
              }
            });
          }
        } else {
          if (callback) { callback(verResult1); }
        }
      });
    }
  }

  copyDataPathToProvisioningProfile(provisioningJSON, sparqlUpdateStmt, sparqlUpdateStmtRollback, callback) {
    let self = this,
      dataPathDir = provisioningJSON.provisioning.dbPath + '/profiles/' + provisioningJSON.provisioning.name + '_DataPatchBackup',
      provisioningDataPatchedFilePath,
      provisioningDataRollbackFilePath,
      result = {
        success: false,
        message: ''
      },
      timestamp;

    if (!fs.existsSync(dataPathDir)){
      fs.mkdirSync(dataPathDir);
    }

    timestamp = dateFormater(new Date(), "yyyy-mmmm-dd_hhMMssTT");
    provisioningDataPatchedFilePath = dataPathDir + '/' + provisioningJSON.provisioning.name + timestamp + '.patch';
    provisioningDataRollbackFilePath = dataPathDir + '/' + provisioningJSON.provisioning.name + timestamp + '.rollback';
    this.io.writeFile(provisioningDataPatchedFilePath, sparqlUpdateStmt, '755', function (writePatchResult) {
      if (writePatchResult.success) {
        self.io.writeFile(provisioningDataRollbackFilePath, sparqlUpdateStmtRollback, '755', function (writeRollbackPatchResult) {
          if (writeRollbackPatchResult.success) {
            result.success = true;
            result.message = 'Data patched';
            if (callback) { callback(result); }
          } else {
            if (callback) { callback(writeRollbackPatchResult); }
          }
        });
      } else {
        if (callback) { callback(writePatchResult); }
      }
    });
  }

  callSparqlUpdateFulltext(sparqlUpdateUrl, sparqlUpdateStmt, callback) {
    let self = this,
      result = {
        success: false,
        message: ''
      };

    this.runner.checkFUSEKIRunning(function (fusekiRunningResult) {
      if (fusekiRunningResult.isRunning) {
        self.runner.checkSOLRRunning(function (solrRunningResult) {
          if (solrRunningResult.isRunning) {
            self.sparqlUpdate('Fulltext/update', sparqlUpdateUrl, sparqlUpdateStmt, function (fusekiResult) {
              if (fusekiResult.success) {
                result.success = true;
                result.message = 'Data patched!';
                debug(result.message);
                if (callback) { callback(result); }
              } else {
                if (callback) { callback(fusekiResult); }
              }
            });
          } else {
            if (callback) { callback(solrRunningResult); }
          }
        });
      } else {
        if (callback) { callback(fusekiRunningResult); }
      }
    });
  }

  callSparqlUpdateInfer(sparqlUpdateUrl, sparqlUpdateStmt, callback) {
    let self = this,
      result = {
        success: false,
        message: ''
      };

    this.runner.checkFUSEKIRunning(function (fusekiRunningResult) {
      if (fusekiRunningResult.isRunning) {
        self.runner.checkSOLRRunning(function (solrRunningResult) {
          if (solrRunningResult.isRunning) {
            self.sparqlUpdate('Infer/update', sparqlUpdateUrl, sparqlUpdateStmt, function (fusekiResult) {
              if (fusekiResult.success) {
                result.success = true;
                result.message = 'Data patched!';
                debug(result.message);
                if (callback) { callback(result); }
              } else {
                if (callback) { callback(fusekiResult); }
              }
            });
          } else {
            if (callback) { callback(solrRunningResult); }
          }
        });
      } else {
        if (callback) { callback(fusekiRunningResult); }
      }
    });
  }

  sparqlUpdate(suffixUrl, sparqlUpdateUrl, updateStatement, callback) {
    let options = {
        uri: sparqlUpdateUrl + suffixUrl,
        headers: {
          'content-type': 'application/sparql-update'
        },
        encoding: 'utf8',
        body: updateStatement
      },
      result = {
        success: false,
        message: '',
        resources: {}
      };

    debug('sparqlUpdate() updateStatement = ', updateStatement);
    debug('sparqlUpdate() options = ', options);
    try {
      request.post(options, function(err, response, body) {
        if (err) {
          result.message = err.toString();
          debug('sparqlUpdate() result = ', result);
          if (callback) { callback(result); }
        } else {
          result.success = true;
          result.message = 'performed';
          result.resources = body;
          debug('sparqlUpdate() result = ', result);
          if (callback) { callback(result); }
        }
      });
    } catch (error) {
      result.message = error.toString();
      debug('sparqlUpdate() result = ', result);
      if (callback) { callback(result); }
    }
  }

  backupOriginalFusekiConfTTLFile(provisioningJson, uuid, originalFusekiConfTTLFilePath, originalProvisioningFilePath) {
    let dataPathDir = provisioningJson.provisioning.dbPath + '/profiles/' + provisioningJson.provisioning.name + '_ContPatchBackup',
      timestamp = dateFormater(new Date(), "yyyymmmmdd_hhMMssTT"),
      fusekiConfBackupTTLFilePath = dataPathDir + '/' + provisioningJson.provisioning.name + '.fuseki.conf.ttl.' + timestamp + '_' + uuid,
      provisioningBackupFilePath = dataPathDir + '/' + provisioningJson.provisioning.name + '.provisioning.json.' + timestamp + '_' + uuid;

    if (!fs.existsSync(dataPathDir)){
      fs.mkdirSync(dataPathDir);
    }

    this.io.writeFile(fusekiConfBackupTTLFilePath, fs.readFileSync(originalFusekiConfTTLFilePath).toString(), '755');
    this.io.writeFile(provisioningBackupFilePath, fs.readFileSync(originalProvisioningFilePath).toString(), '755');
  }

  mergePatchDataIntoProvisoning(originalFusekiConfTTLFilePath, profileProvisioningFilePath, profileProvisioningJSON, patchJson, callback) {
    let newFusekiConfigJTTL,
      patchGraphNames = Object.keys(patchJson.provisioning.organizations),
      patchGraph,
      patchPrefixKeys,
      patchPrefixUri,
      patchMapKeys,
      patchMapUri,
      duplication = {
        duplicatedPatchPrefixes: {},
        duplicatedPatchMaps:{}
      };

    patchGraphNames.forEach(function(graphName) {
      patchGraph = patchJson.provisioning.organizations[graphName];

      patchPrefixKeys = Object.keys(patchGraph.prefixes);
      patchPrefixKeys.forEach(function(patchPrefixKey) {
        if (profileProvisioningJSON.provisioning.organizations[graphName] === undefined) {
          profileProvisioningJSON.provisioning.organizations[graphName] = {}
        }
        if (profileProvisioningJSON.provisioning.organizations[graphName].prefixes === undefined ) {
          profileProvisioningJSON.provisioning.organizations[graphName].prefixes = {};
        }
        if (profileProvisioningJSON.provisioning.organizations[graphName].prefixes[patchPrefixKey] === undefined) {
          patchPrefixUri = patchGraph.prefixes[patchPrefixKey];
          profileProvisioningJSON.provisioning.organizations[graphName].prefixes[patchPrefixKey] = patchPrefixUri;
          debug('added prefix = ' + patchPrefixKey + ':' + patchPrefixUri);
        } else {
          duplication.duplicatedPatchPrefixes[patchPrefixKey] = patchPrefixKey + ' is already exist.';
          debug('duplicatedPatchPrefix = ' + patchPrefixKey);
        }
      });

      patchMapKeys = Object.keys(patchGraph.maps);
      patchMapKeys.forEach(function(patchMapKey) {
        if (profileProvisioningJSON.provisioning.organizations[graphName].maps === undefined) {
          profileProvisioningJSON.provisioning.organizations[graphName].maps = {};
        }
        if (profileProvisioningJSON.provisioning.organizations[graphName].maps[patchMapKey] === undefined) {
          patchMapUri = patchGraph.maps[patchMapKey];
          profileProvisioningJSON.provisioning.organizations[graphName].maps[patchMapKey] = patchMapUri;
          debug('added map = ' + patchMapKey + ':' + patchMapUri);
        } else {
          duplication.duplicatedPatchMaps[patchMapKey] = patchMapKey + ' is already exist.';
          debug('duplicatedPatchMap = ' + patchMapKey);
        }
      });
    });


    newFusekiConfigJTTL = this.generateFusekiConf(profileProvisioningJSON);
    this.io.writeFile(originalFusekiConfTTLFilePath, newFusekiConfigJTTL, '755');
    profileProvisioningJSON.lastModifiedDate = new Date();
    this.io.writeFile(profileProvisioningFilePath, JSON.stringify(profileProvisioningJSON, null, 2), '755');
    if (callback) { callback(profileProvisioningJSON, duplication); }

  }

  addPatchIntoExistingProvisioningFile(uuid, processedProvisioningJSON, patchFilePath, patchJson, duplication, callback) {
    let profileProvisioningFilePath = provisioningJSON.provisioning.dbPath + '/profiles/' +
          processedProvisioningJSON.provisioning.name + '.provisioning.json';

    if (processedProvisioningJSON.patches === undefined) {
      processedProvisioningJSON.patches = [];
    }

    processedProvisioningJSON.patches.push({
      patchId: uuid,
      patchDate: new Date,
      duplication: duplication,
      patchFile: patchFilePath.split('/').pop()
    });

    this.io.writeFile(profileProvisioningFilePath, JSON.stringify(processedProvisioningJSON, null, 2), '755', function () {
      if (callback) { callback(); }
    });
  }

  addSolrCores(provisioning, callback) {
    let self = this,
      organizations,
      graph,
      spawnInstance,
      json,
      provisioningContent,
      cores = '',
      result = {
        success: false,
        message: ''
      };

    this.io.readProvisioningJSONOrFilePath(provisioning, function (verResult) {
      if (verResult.success) {
        self.runner.checkSOLRRunning(function (result) {
            if (result.isRunning) {
              json = verResult.json;
              organizations = Object.keys(json.provisioning.organizations),
              organizations.forEach(function(graphName) {
                graph = json.provisioning.organizations[graphName];
                  cores += graphName + ' ';
                  spawnInstance = spawn(__dirname + '/../solr/bin/solr', ['create_core', '-c', graphName, '-d', './conf/solrTemplate']);
                  spawnInstance.stdout.on('data', function(data) {
                    debug('spawn.stdout: ', data.toString());
                  });
                  spawnInstance.stderr.on('data', function(data) {
                    debug('stderr.on: ',  data.toString());
                  });
                  spawnInstance.on('close', function(code) {
                    debug('spawn exit code: ', code);
                    result.success = true;
                    result.message = cores + ' have been added!';
                    debug(result.message);
                    if (callback) { callback(result); }
                  });
              });
            } else {
              result.message = 'SOLR is not running!';
              debug(result.message);
              if (callback) { callback(result); }
            }
          });
      } else {
        if (callback) { callback(verResult); }
      }
    });
  }

  addProvisioning(provisioning, callback) {
    let self = this,
      json,
      provisioningContent,
      result = {
        success: false,
        message: ''
      };

    this.io.readProvisioningJSONOrFilePath(provisioning, function (verResult) {
      if (verResult.success) {
        self.processedProvisioning(verResult.json, function (processedResult) {
          if (callback) { callback(processedResult); }
        }); 
      } else {
        if (callback) { callback(verResult); }
      }
    });
  }

  processedProvisioning(json, callback) {
    let self = this,
      datasetName,
      runtimeProvisoningFile,
      runtimeProvisoningFilePath,
      confFile,
      envScript,
      runScript,
      confFilePath,
      envScriptFilePath,
      runScriptFilePath,
      fusekiShiroScriptFile,
      fusekiShiroScriptFilePath,
      solrStartForegroundScriptFile,
      solrStartBackgroundScriptFile,
      solrStopBackgroundScriptFile,
      solrStartScriptFilePath,
      solrStopScriptFilePath,
      result = {
        success: false,
        message: ''
      },
      profileBaseDir = json.provisioning.dbPath + '/profiles/',
      fusekiBaseDir = json.provisioning.dbPath + '/FUSEKI_' + json.provisioning.name,
      solrBaseDir = json.provisioning.dbPath + '/SOLR_' + json.provisioning.name;

    if (!fs.existsSync(profileBaseDir)) {
      fs.mkdirSync(profileBaseDir);
    }

    if (!fs.existsSync(fusekiBaseDir)) {
      fs.mkdirSync(fusekiBaseDir);
    }

    if (!fs.existsSync(solrBaseDir)) {
      fs.mkdirSync(solrBaseDir);
    }

    this.io.writeFile(solrBaseDir + '/solr.xml',
      fs.readFileSync('./conf/solrTemplate/solr.xml').toString(), '755');

    datasetName = json.provisioning.name;
    runtimeProvisoningFile = JSON.stringify(json, null, 2);
    runtimeProvisoningFilePath = json.provisioning.dbPath + '/profiles/' + datasetName + '.provisioning.json';
    json.creationDate = new Date();
    confFile = this.generateFusekiConf(json);
    envScript = this.fusekiEnvScript(json);
    runScript = this.fusekiRunScript(json);
    confFilePath = json.provisioning.dbPath + '/profiles/' + datasetName + '.fuseki.conf.ttl';
    envScriptFilePath = json.provisioning.dbPath + '/profiles/' + datasetName + '.fuseki.env.sh';
    runScriptFilePath = json.provisioning.dbPath + '/profiles/' + datasetName + '.fuseki.start.sh';

    solrStartBackgroundScriptFile = this.solrStartScript(json);
    solrStopBackgroundScriptFile = this.solrStopScript();
    fusekiShiroScriptFile = this.fusekiShiroScript(json);

    solrStartScriptFilePath = json.provisioning.dbPath + '/profiles/' + datasetName + '.solr.start.sh';
    solrStopScriptFilePath =  json.provisioning.dbPath + '/profiles/' + datasetName + '.solr.stop.sh';
    fusekiShiroScriptFilePath =  json.provisioning.dbPath + '/profiles/' + datasetName + '.fuseki.shiro.ini';

    this.io.writeFile(runtimeProvisoningFilePath, runtimeProvisoningFile, '755');
    this.io.writeFile(confFilePath, confFile, '755');
    this.io.writeFile(envScriptFilePath, envScript, '755');
    this.io.writeFile(runScriptFilePath, runScript, '755');
    this.io.writeFile(solrStartScriptFilePath, solrStartBackgroundScriptFile, '755');
    this.io.writeFile(solrStopScriptFilePath, solrStopBackgroundScriptFile, '755');
    this.io.writeFile(fusekiShiroScriptFilePath, fusekiShiroScriptFile, '755', function () {
      self.io.writeFile(fusekiBaseDir + '/custom.shiro.ini',
        fs.readFileSync( json.provisioning.dbPath + '/profiles/' + json.provisioning.name + '.fuseki.shiro.ini').toString(), '755');
    });

    result.success = true;
    result.message = runtimeProvisoningFilePath + ' has been added!'
    debug(result.message);
    if (callback) { callback(result); }
  }

  generateFusekiConf(provisioningJson) {
    let c = '';

    c += this.fusekiConfStdPrefixes();
    c += this.fusekiConfUserPrefixes(provisioningJson);
    c += this.fusekiConfServiceDef(provisioningJson);
    c += this.fusekiConfClassLoaders();
    c += this.fusekiConfServiceMap(provisioningJson);

    return c;
  }

  
  fusekiConfStdPrefixes() {
    let self = this, uri, c = '', stdPrefixKeys;

    stdPrefixKeys = Object.keys(this.stdPrefixes),
    stdPrefixKeys.forEach(function (stdPrefix) {
      uri = self.stdPrefixes[stdPrefix];
      c += '@prefix ' + stdPrefix + ': <' + uri + '> .\n';
    });

    c += '\n';
    return c;
  }

  fusekiConfUserPrefixes(json) {
    let self = this,
      c = '\n',
      organizations = Object.keys(json.provisioning.organizations),
      graph,
      prefixKeys;

    organizations.forEach(function (graphName) {
      graph = json.provisioning.organizations[graphName];
      if (graph.prefixes !== undefined) {
        prefixKeys = Object.keys(graph.prefixes);
        prefixKeys.forEach(function(prefixKey) {
          if (self.stdPrefixes[prefixKey] === undefined) {
            c += '@prefix ' + prefixKey + ': <' + graph.prefixes[prefixKey]  + '> .\n';
          } else {
            debug('UserPrefiex: ' + prefixKey + ' is already exist. It will not be added into the existing provisioning file.');
          }
        });
      }
    });
    c += '\n';

    return c;
  }

  fusekiConfServiceDef (json) {
    let c = '\n',
      c1 = '[] rdf:type fuseki:Server ;\n',
      c2 = '\tfuseki:services (\n',
      cl = '\t) .\n',
      organizations = Object.keys(json.provisioning.organizations);

    c += c1;
    c += c2;

    organizations.forEach(function(graphName) {
      c += '\t\t<#' + graphName + 'Fulltext>\n';
      // infer
      c += '\t\t<#' + graphName + 'Infer>\n';
    });

    c += cl;
    return c;
  }

  fusekiConfClassLoaders() {
    let classLoaders = '\n' +
      '[] ja:loadClass "com.hp.hpl.jena.tdb.TDB" .\n' + 
      'tdb:DatasetTDB rdfs:subClassOf ja:RDFDataset .\n' + 
      'tdb:GraphTDB rdfs:subClassOf ja:Model .\n' + 
      '\n' + 
      '[] ja:loadClass "org.apache.jena.query.text.TextQuery" .\n' + 
      'text:TextDataset rdfs:subClassOf ja:RDFDataset .\n' + 
      'text:TextIndexSolr rdfs:subClassOf text:TextIndex .\n' + 
      'text:TextIndexLucene rdfs:subClassOf text:TextIndex .\n';
    return classLoaders;
  }

  fusekiConfServiceMap (json) {
    let c = '\n',
      organizations = Object.keys(json.provisioning.organizations),
      organizationJson,
      mapKeys,
      mapValue;

    organizations.forEach(function(organization) {
      organizationJson = json.provisioning.organizations[organization];
      // infer
      c += '<#' + organization + 'Infer> rdf:type fuseki:Service ;\n';
      c += '\trdfs:label "TDB/text service" ;\n';
      c += '\tfuseki:name "' + organization + 'Infer" ;\n';
      c += '\tfuseki:serviceQuery "query" ;\n';
      c += '\tfuseki:serviceQuery "sparql" ;\n';
      c += '\tfuseki:serviceUpdate "update" ;\n';
      c += '\tfuseki:serviceUpload "upload" ;\n';
      c += '\tfuseki:serviceReadGraphStore "get" ;\n';
      c += '\tfuseki:serviceReadWriteGraphStore "data" ;\n';
      c += '\tfuseki:dataset <#dataset-' + organization + '-infer> ;\n';
      c += '\t.\n';
      c += '\n';

      c += '<#dataset-' + organization + '-infer> rdf:type ja:RDFDataset ;\n';
      c += '\tja:defaultGraph <#dataset-' + organization + '-infer-model> ;\n';
      c += '\t.\n';
      c += '\n';

      c += '<#dataset-' + organization + '-infer-model> a ja:InfModel ;\n';
      c += '\tja:baseModel <#dataset-' + organization + '-infer-graph> ;\n';
      c += '\tja:reasoner [ ja:reasonerURL <http://jena.hpl.hp.com/2003/OWLFBRuleReasoner> ] ;\n';
      c += '\t.\n';
      c += '\n';

      c += '<#dataset-' + organization + '-infer-graph> rdf:type tdb:GraphTDB ;\n';
      c += '\ttdb:dataset <#dataset-' + organization + '-infer-dataset> ;\n';
      c += '\t.\n';
      c += '\n';

      c += '<#dataset-' + organization + '-infer-dataset> rdf:type tdb:DatasetTDB ;\n';
      c += '\ttdb:location "' + json.provisioning.dbPath + '/FUSEKI_' + json.provisioning.name + '/' + organization + 'Infer" ;\n';
      c += '\ttdb:unionDefaultGraph true ;\n';
      c += '\t.\n';
      c += '\n';
      // infer

      c += '<#' + organization + 'Fulltext> rdf:type fuseki:Service ;\n';
      c += '\trdfs:label "TDB/text service" ;\n';
      c += '\tfuseki:name "' + organization + 'Fulltext" ;\n';
      c += '\tfuseki:serviceQuery "query" ;\n';
      c += '\tfuseki:serviceQuery "sparql" ;\n';
      c += '\tfuseki:serviceUpdate "update" ;\n';
      c += '\tfuseki:serviceUpload "upload" ;\n';
      c += '\tfuseki:serviceReadGraphStore "get" ;\n';
      c += '\tfuseki:serviceReadWriteGraphStore "data" ;\n';
      c += '\tfuseki:dataset <#dataset-' + organization + '-fulltext> ;\n';
      c += '\t.\n';
      c += '\n';

      c += '<#dataset-' + organization + '-fulltext> rdf:type text:TextDataset ;\n';
      c += '\ttext:dataset <#dataset-' + organization + '-fulltext-dataset> ;\n';
      c += '\ttext:index <#dataset-' + organization + '-fulltext-index> ;\n';
      c += '\t.\n';
      c += '\n';

      c += '<#dataset-' + organization + '-fulltext-dataset> rdf:type tdb:DatasetTDB ;\n';
      c += '\ttdb:location "' + json.provisioning.dbPath + '/FUSEKI_' + json.provisioning.name + '/' + organization + 'Fulltext" ;\n';
      c += '\ttdb:unionDefaultGraph true ; \n';
      c += '\t.\n';
      c += '\n';

      c += '<#dataset-' + organization + '-fulltext-index> a text:TextIndexSolr ;\n';
      c += '\ttext:server <http://localhost:8983/solr/' + organization + '> ;\n';
      c += '\ttext:entityMap <#dataset-' + organization + '-fulltext-map> ;\n';
      c += '\t.\n';
      c += '\n';

      c += '<#dataset-' + organization + '-fulltext-map>  a text:EntityMap ;\n';
      c += '\ttext:entityField "uri" ;\n';

      if (conf.enabledNamedGraph) {
        c += '\ttext:graphField "p_graph" ;\n';
      }

      c += '\ttext:uidField  "uid" ;\n';
      c += '\ttext:defaultField "p_rdfs.label" ;\n';
      c += '\ttext:langField  "lang" ;\n';
      c += '\ttext:map (\n';
      c += '\t\t[ text:field "p_rdfs.label" ; text:predicate rdfs:label ]\n';
      c += '\t\t[ text:field "p_rdf.type" ; text:predicate rdf:type ]\n';
      c += '\t\t[ text:field "p_owl.sameAs" ; text:predicate owl:sameAs ]\n';

      if (organizationJson.maps !== undefined) {
        debug('CHECK organizationJson.maps = ',organizationJson.maps);
        mapKeys = Object.keys(organizationJson.maps);
        mapKeys.forEach(function (mapKey) {
          mapValue = organizationJson.maps[mapKey];
          if (mapKey.startsWith('p_')) {
            mapKey = mapKey.replace('p_', '');
          }
          c += '\t\t[ text:field "p_' + mapKey + '" ; text:predicate ' + mapValue + ' ]\n';
        });
      }

      c += '\t)\n';
      c += '\t.\n';
      c += '\n';

    });

    return c;
  }

  fusekiEnvScript (json) {
    let c = '#! /bin/bash \n' + 
      'export FUSEKI_HOME="' + __dirname + '/../fuseki" \n' +
      'export FUSEKI_BASE="' + json.provisioning.dbPath + '/FUSEKI_' + json.provisioning.name +'" \n' +
      '\n' +
      'if [ ! -e "$FUSEKI_HOME" ] \n' +
      'then \n' +
      '\t echo "$FUSEKI_HOME does not exist" 1>&2 \n' +
      '\t exit 1 \n' +
      '\t fi \n' +
      '\n' +
      'JAR1="$FUSEKI_HOME/fuseki-server.jar" \n' +
      'JAR="" \n' +
      '\n' +
      'for J in "$JAR1" \n' +
      'do \n' +
      '\t # Expand \n' +
      '\t J="$(echo $J)" \n' +
      '\t if [ -e "$J" ] \n' +
      '\t then \n' +
      '\t  JAR="$J" \n' +
      '\t  break \n' +
      '\t    fi \n' +
      'done \n' +
      '\n' +
      'if [ "$JAR" = "" ] \n' +
      'then \n' +
      '\t   echo "Cannot find jarfile to run" \n' +
      '\t   exit 1 \n' +
      'fi \n' +
      '\n' +
      '# Deal with Cygwin path issues \n' +
      'cygwin=false \n' +
      'case "`uname`" in \n' +
      '\t   CYGWIN*) cygwin=true;; \n' +
      'esac \n' +
      'if [ "$cygwin" = "true" ] \n' +
      'then \n' +
      '\t   JAR=`cygpath -w "$JAR"` \n' +
      '\t   FUSEKI_HOME=`cygpath -w "$FUSEKI_HOME"` \n' +
      'fi \n' +
      '\n' +
      'export FUSEKI_BASE="${FUSEKI_BASE:-$PWD/run}" \n' +
      '\n' +
      'JVM_ARGS="${JVM_ARGS} -Xmx' + json.provisioning.fuseki.memory + ' " \n' +
      'echo $JVM_ARGS \n' +
      'exec java  $JVM_ARGS -jar "$JAR" "$@" \n' +
      ' \n';

    return c;
  }

  fusekiRunScript (json) {
    let c = '#! /bin/bash \n';
    
    c += 'nohup ' + json.provisioning.dbPath + '/profiles/' + json.provisioning.name + '.fuseki.env.sh -v --update --port ' + json.provisioning.fuseki.port + ' --conf=' + json.provisioning.dbPath + '/profiles/' + json.provisioning.name + '.fuseki.conf.ttl  0<&- &> ' + json.provisioning.dbPath + '/log_FUSEKI_' + json.provisioning.name + '.log & \n';

    return c;
  }

  solrStartScript(json) {
    let c = '#! /bin/bash \n';

    c += __dirname + '/../solr/bin/solr start -p ' + json.provisioning.solr.port + ' -h localhost -m ' +  json.provisioning.solr.memory + ' -s ' + json.provisioning.dbPath + '/SOLR_' + json.provisioning.name + ' \n';
    return c;
  }

  solrStopScript() {
    let c = '#! /bin/bash \n';

    c += __dirname + '/../solr/bin/solr stop \n';
    return c;
  }

  fusekiShiroScript (json) {
    let c = '\n';

    c += '[main] \n';
    c += 'ssl.enabled = true  \n';
    c += '\n';
    c += 'plainMatcher=org.apache.shiro.authc.credential.SimpleCredentialsMatcher \n';
    c += 'iniRealm.credentialsMatcher = $plainMatcher \n';
    c += 'localhost=org.apache.jena.fuseki.authz.LocalhostFilter \n';
    c += '\n';
    c += '[users] \n';
    c += json.provisioning.fuseki.user + '=' + json.provisioning.fuseki.password + ' \n';
    c += '\n';
    c += '[roles] \n';
    c += '\n';
    c += '[urls] \n';
    c += '/$/status = anon \n';
    c += '/$/ping   = anon \n';
    c += '/** = authcBasic,user[' + json.provisioning.fuseki.user + '] \n';

    return c;
  }


}

module.exports = Generator;
