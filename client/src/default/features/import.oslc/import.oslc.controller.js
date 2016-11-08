import jqueryOslcFuncs from './oslc.js';
import angular from 'angular';

export default class ImportOSLCController {

  constructor(
    $rootScope,
    $window,
    $scope,
    $http,
    $location,
    $timeout,
    $q,
    apiManagerService,
    notificationManagerService,
    sessionManagerService) {

    let self = this;

    this.r = $rootScope;
    this.scope = $scope;
    this.q = $q;
    this.http = $http;
    this.window = $window;
    this.timeout = $timeout;
    this.apiManagerService = apiManagerService;
    this.sessionManagerService = sessionManagerService;
    this.notifier = notificationManagerService;
    this.location = $location;
    this.domain = this.sessionManagerService.get('org').domain +
      '/' + this.sessionManagerService.get('profile').email + '/default';
    this.defaultDomain = this.domain;
    this.datasetSearchScope = this.domain;
    this.showApp = false;
    this.isOpen = true;
    this.enabled = false;
    this.inprogress = false;
    this.progressProcessName = '';
    this.progressPercentage = 0;
    this.progressStatus = '';
    this.progressBarCssClass = 'progress-bar-info';
    this.progressLogs = [];
    this.progressTotalItem = 0;
    this.progressCurrentItem = 0;
    this.serviceProvidersResponse = {
      status: false,
      response: '',
      serviceProviders: []
    };
    this.kldmURL = '';
    this.closeImportLogs = true;
    this.importLogs = [];
    this.serviceProviderCatalogUri = 'http://localhost:8080/oslc4jsimulink/services/catalog/singleton';
    this.OSLCServiceProviderCatalogs = [];
    this.importedServiceProviders = [];
    this.importWithServiceProviderCatalog = false;
    this.importServiceProvider = '';

    this.loadAllImportLogs(function (data) {
      self.importLogs = data;
    });
  }

  broadcast() {
    this.r.$broadcast('refreshUI', {});
  }

  changeLogViewer() {
    this.closeImportLogs = !this.enabled;
  };

  reloadImportLogs() {
    let self = this;

    this.importLogs = [];
    this.loadAllImportLogs(function (data) {
      self.importLogs = data;
    });
  };

  parseXmlNS(existingXMLNS, serviceProvider, index) {
    let j;

    this.jqueryOslcFuncs.parseXmlNS(
      serviceProvider.ServiceNodes[index].queryBaseRdf,
      function (returnXmlNS) {
        for (j = 0; j < returnXmlNS.xmlns.length; j++) {
          if (returnXmlNS.xmlns[j].name.indexOf('xmlns') === 0) {
            if (existingXMLNS[ returnXmlNS.xmlns[j].name ] === undefined) {
              serviceProvider.serviceNodeXmlNS.push(returnXmlNS.xmlns[j]);
              existingXMLNS[returnXmlNS.xmlns[j].name] = returnXmlNS.xmlns[j];
            }
          }
        }
      }
    );
  }

  lookupXmlNS(serviceProvider) {
    let i, existingXMLNS = [];

    this.serviceProvider.serviceNodeXmlNS = [];
    for (i = 0; i < this.serviceProvider.ServiceNodes.length; i++) {
      this.parseXmlNS(existingXMLNS, serviceProvider, i);
    }
  };

  lookupQueryBase(serviceNode, callback) {
    if (serviceNode.queryBase.indexOf('http') === 0) {
      serviceNode.queryBaseRdf = '';
      this.http({
        url: serviceNode.queryBase,
        dataType: 'json',
        method: 'GET',
        data: '',
        cache: false,
        withCredentials: true,
        headers: {
          'Accept': 'application/rdf+xml',
          'OSLC-Core-Version': '2.0'
        }
      }).success(function (response) {
        serviceNode.queryBaseStatus = false;
        serviceNode.queryBaseRdf = response;
        if (serviceNode.queryBaseRdf === undefined ||
            serviceNode.queryBaseRdf === null ||
            serviceNode.queryBaseRdf === '') {
          serviceNode.queryBaseStatus = false;
          callback(serviceNode);
        } else {
          serviceNode.queryBaseStatus = true;
          jqueryOslcFuncs.parseQueryBaseItems(
            serviceNode.queryBaseRdf,
            serviceNode.queryBase,
            function (returnQueryBase) {
              serviceNode.queryBaseTitle = returnQueryBase.title;
              serviceNode.queryBaseItems = returnQueryBase.queryBaseItems;
              callback(serviceNode);
            }
          );
        }
      }).error(function (error) {
        console.error('lookupQueryBase error', error);
        serviceNode.queryBaseStatus = false;
        callback(serviceNode);
      });
    }
  };

  cancel() {
    this.OSLCServiceProviderCatalogs = [];
  }

  uuid() {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
      s4() + '-' + s4() + s4() + s4();
  }

  loadServiceProviders() {
    let self = this;

    if (this.serviceProviderCatalogUri === '') {
      alert('Service Provider Catalog URI cannot be empty');
      return;
    }

    self.importedServiceProviders = [];
    this.inprogress = true;
    this.r.myPromise = this.http({
      url: this.serviceProviderCatalogUri,
      dataType: 'xml',
      method: 'GET',
      data: '',
      cache: false,
      withCredentials: true,
      headers: {
        'Accept': 'application/rdf+xml',
        'OSLC-Core-Version': '2.0'
      }
    }).success(function (response) {
      let catalog = {
        uri: '',
        uid: self.uuid(),
        rdf: '',
        importProcessStarted: false,
        imported: false,
        isLoaded: false,
        serviceProviders: []
      };

      catalog.uri = angular.copy(self.serviceProviderCatalogUri);
      self.serviceProviderCatalogUri = '';
      self.OSLCServiceProviderCatalogs.push(catalog);

      self.serviceProvidersResponse = {
        status: false,
        rdf: '',
        response: '',
        serviceProviders: []
      };

      catalog.isLoaded = true;
      catalog.rdf = response;
      self.serviceProvidersResponse.status = catalog.isLoaded;
      self.serviceProvidersResponse.rdf = catalog.rdf;

      jqueryOslcFuncs.parseServiceProviders(response, function (returnResource) {
        let length, i, j;

        self.serviceProvidersResponse.serviceProviders = returnResource.serviceProviders;
        length = self.serviceProvidersResponse.serviceProviders.length;
        for (i = 0; i < length; i++) {
          let serviceProvider = self.serviceProvidersResponse.serviceProviders[i];

          serviceProvider.imported = false;
          serviceProvider.importProcessStarted = false;
          serviceProvider.catalogUri = catalog.uri;
          serviceProvider.catalogUid = catalog.uid;
          catalog.serviceProviders.push(serviceProvider);

          for (j = serviceProvider.ServiceNodes.length - 1; j >= 0; j--) {
            self.lookupQueryBase(serviceProvider.ServiceNodes[j], function (checkedServiceNode) {
              if (checkedServiceNode.queryBaseStatus === false) {
              }
            });
          }
          self.inprogress = false;
        }
      });
    }).error(function (error) {
      console.error('loadServiceProviders error', error);
      self.serviceProvidersResponse = {
        status: false,
        rdf: '',
        response: '',
        serviceProviderObjects: []
      };

      self.serviceProvidersResponse.status = false;
      self.serviceProvidersResponse.rdf = '';
      self.serviceProvidersResponse.serviceProviders = [];
      if (self.serviceProviderCatalogUri !== undefined) {
        self.serviceProviderCatalogUri + '">' +
        self.serviceProviderCatalogUri + '</a>';
      }
      self.inprogress = false;
    });
  };

  addProgressBar(processName, processStatus, processStatusText) {
    this.calcualteProgressBar(processName, processStatusText);
  };

  calcualteProgressBar(processName, processStatusText) {
    let self = this, progress;

    this.progressCurrentItem++;
    progress = Math.round((this.progressCurrentItem / this.progressTotalItem) * 100);
    if (progress === 100) {
      this.progressProcessName = processName;
      this.progressStatus = processStatusText;
      this.progressPercentage = progress;
      this.progressBarCssClass = 'progress-bar-success';
      setTimeout(function () {
        self.reloadImportLogs();
      }, 3000);
    } else {
      this.progressProcessName = processName;
      this.progressStatus = processStatusText;
      this.progressPercentage = progress;
    }
  }

  clearProgressBar() {
    this.progressProcessName = '';
    this.progressPercentage = 0;
    this.progressStatus = '';
    this.progressBarCssClass = 'progress-bar-info';
    this.progressLogs = [];
    this.progressTotalItem = 0;
    this.progressCurrentItem = 0;
  }

  isDisabledDeletionButton() {
    if (this.progressPercentage === 0 || this.progressPercentage === 100) {
      return false;
    }
    return true;
  };

  closeProgressBar() {
    this.clearProgressBar();
  };

  setupProgressBar(progressTotalItem) {
    this.progressTotalItem = progressTotalItem;
  }

  countOSLCService(command, callback) {
    if (command.type !== 'specific' && command.type !== 'all') {
      alert('Invalid input for counting OSLC Service');
      return;
    }

    if (command.type === 'specific') {
      if (command.inputObject === undefined) {
        alert('command.serviceProvider cannot be null');
      }

      this.countOSLCServiceOfSpecificServiceProvider(command.inputObject, function (count) {
        callback(count);
      });
    } else if (command.type === 'all') {
      if (command.inputObject === undefined ||
          command.inputObject.length === 0) {
        alert('command.serviceProviders cannot be null or empty');
        return;
      }

      this.countOSLCServiceOfAllServiceProviders(command.inputObject, function (count) {
        callback(count);
      });
    } else {
      alert('Found error in counting OSLC Service');
      return;
    }
  }

  countOSLCServiceOfSpecificServiceProvider(serviceProvider, callback) {
    let count = 0,
      max = serviceProvider.ServiceNodes.length,
      i,
      serviceNode;

    for (i = 0; i < max; i++) {
      serviceNode = serviceProvider.ServiceNodes[i];
      if (serviceNode !== null &&
          serviceNode.queryBaseStatus !== false &&
          serviceNode.type === 'queryCapability') {
        count++;
      }
      if (i === (max - 1)) callback(count);
    }
  }

  countOSLCServiceOfAllServiceProviders(serviceProviders, callback) {
    let allCount = 0,
      max = serviceProviders.length,
      i;

    for (i = 0; i < serviceProviders.length; i++) {
      this.countOSLCServiceOfSpecificServiceProvider(
        serviceProviders[i],
        function (count) {
          allCount += count;
        }
      );
      if (i === (max - 1)) callback(allCount);
    }
  }

  startDatastore(callback) {
    let self = this;

    this.inprogress = true;
    this.apiManagerService.provisioningApiStartDatastore(function (result) {
      console.log('result = ', result);
      if (result.returnData.success) {
        if (!callback) self.notifier.success({message: result.returnData.message});
        if (callback) { callback(true); }
      } else {
        if (!callback) self.notifier.error({message: result.returnData.message});
        if (callback) { callback(false); }
      }
      self.inprogress = false;
    });
  }

  stopDatastore(callback) {
    let self = this;

    this.inprogress = true;
    this.apiManagerService.provisioningApiStopDatastore(function (result) {
      console.log('result = ', result);
      if (result.returnData.success) {
        if (!callback) self.notifier.success({message: result.returnData.message});
        if (callback) { callback(true); }
      } else {
        if (!callback) self.notifier.error({message: result.returnData.message});
        if (callback) { callback(false); }
      }
      self.inprogress = false;
    });
  }

  genConf(graphName, rdfDir, outputDir, callback) {
    this.apiManagerService.provisioningApiGenConf(graphName, rdfDir, outputDir, function (result) {
      if (callback) { callback(result); }
    });
  }

  addConf(patchDir, callback) {
    this.apiManagerService.provisioningApiAddConf(patchDir, function (result) {
      if (callback) { callback(result); }
    });
  }

  genData(graphName, rdfDir, format, outputDir, callback) {
    this.apiManagerService.provisioningApiGenData(graphName, rdfDir, format, outputDir, function (result) {
      if (callback) { callback(result); }
    });
  }

  addData(generatedDataPatchDir, datasetIdentifier, format, callback) {
    this.apiManagerService.provisioningApiAddData(generatedDataPatchDir,
        datasetIdentifier, format, function (result) {
      if (callback) { callback(result); }
    });
  }

  addLog(organization, email, patchedStmts, callback) {
    this.apiManagerService.provisioningApiAddLog(
      organization,
      email,
      patchedStmts,
      function (result) {
        if (callback) { callback(result); }
      });
  }

  callZipProcess(importWithServiceProviderCatalog, serviceProvider, callback) {
    let params = {
      serviceProviderCatalogUID: serviceProvider.catalogUid,
      importWithServiceProviderCatalog: importWithServiceProviderCatalog,
      serviceProvider: serviceProvider
    };

    this.apiManagerService.fusekiApiPostZipImportFiles(params, function (result) {
      callback(result);
    });
  }

  loadAllImportLogs(callback) {
    let data = {solrDocs: [], importLogs: []},
      parameters = this.prepareImportLogSolrCallParameters();

    this.callSolrApi(parameters, function (solrDocs) {
      let solrReturnDocsLength,
        temp = [],
        i, f,
        uids = [],
        uid_check = [];

      solrReturnDocsLength = solrDocs.response.docs.length;

      if (solrReturnDocsLength === 0) {
        return;
      }

      data.solrDocs = solrDocs;
      for (i = 0; i < solrReturnDocsLength; i++) {
        let object = solrDocs.response.docs[i],
          uri = object.uri[0];

        if (temp[uri] === undefined) {
          temp[uri] = {
            uri: uri,
            uid: '',
            rdf_type: '',
            kld_importedDate: '',
            kld_importedServiceProvider: '',
            kld_importedServiceProviderUri: '',
            kld_importedFilePaths: [],
            kld_importedQueryCapabilities: [],
            kld_importServiceProviderCatalogUID: '',
            kld_importedServiceProviderCatalogZipFilePath: '',
            kld_importServiceProviderCatalogURI: '',
            kld_importFromEntireServiceProviderCatalog: '',
            catalogs: []
          };
          data.importLogs.push(temp[uri]);
        }

        if (object.rdf_type !== undefined) {
          temp[uri].rdf_type = object.rdf_type[0];
        }

        if (object.kld_importedDate !== undefined) {
          temp[uri].kld_importedDate = object.kld_importedDate[0];
        }

        if (object.kld_importedServiceProviderUri !== undefined) {
          temp[uri].kld_importedServiceProviderUri = object.kld_importedServiceProviderUri[0];
          temp[uri].kld_importedServiceProvider = temp[uri].kld_importedServiceProviderUri.split('/').pop();
        }

        if (object.kld_importedFilePath !== undefined) {
          temp[uri].kld_importedFilePaths.push(object.kld_importedFilePath[0]);
        }

        if (object.kld_importedQueryCapability !== undefined) {
          temp[uri].kld_importedQueryCapabilities.push(object.kld_importedQueryCapability[0]);
        }

        if (object.kld_importServiceProviderCatalogUID !== undefined) {
          let uid = object.kld_importServiceProviderCatalogUID[0];

          temp[uri].kld_importServiceProviderCatalogUID = uid;
        }

        if (object.kld_importedServiceProviderCatalogZipFilePath !== undefined) {
          temp[uri].kld_importedServiceProviderCatalogZipFilePath =
            object.kld_importedServiceProviderCatalogZipFilePath[0];
        }

        if (object.kld_importServiceProviderCatalogURI !== undefined) {
          temp[uri].kld_importServiceProviderCatalogURI =
            object.kld_importServiceProviderCatalogURI[0];
        }

        if (object.kld_importFromEntireServiceProviderCatalog !== undefined) {
          temp[uri].kld_importFromEntireServiceProviderCatalog =
            object.kld_importFromEntireServiceProviderCatalog[0];
        }
      }

      for (i = 0; i < data.importLogs.length; i++) {
        let _log = data.importLogs[i],
          uid = {
            uid: '',
            importDate: '',
            serviceProviderCatalogZipFilePath: '',
            serviceProviderCatalogURI: '',
            serviceProviders: []
          },
          serviceProvider = {
            title: '',
            uri: '',
            queryCapabilities: []
          };

        uid.uid = _log.kld_importServiceProviderCatalogUID;
        uid.serviceProviderCatalogURI = _log.kld_importServiceProviderCatalogURI;
        uid.importDate = _log.kld_importedDate;
        uid.serviceProviderCatalogZipFilePath = _log.kld_importedServiceProviderCatalogZipFilePath;
        serviceProvider.title = _log.kld_importedServiceProvider;
        serviceProvider.uri = _log.kld_importedServiceProviderUri;

        for (f = 0; f < _log.kld_importedFilePaths.length; f++) {
          let _filePath = _log.kld_importedFilePaths[f],
            _queryCapability = _log.kld_importedQueryCapabilities[f],
            queryCapability = {
              filePath: _filePath,
              title: _queryCapability
            };

          serviceProvider.queryCapabilities.push(queryCapability);
        };

        uid.serviceProviders.push(serviceProvider);
        uids.push(uid);
      }

      for (i = 0; i < uids.length; i++) {
        let theUid = uids[i], j, theLatestUid, duplicatedServiceProvider;

        if (uid_check[theUid.uid] === undefined) {
          uid_check[theUid.uid] = theUid.uid;
          uid_check[theUid.uid + '_latestUid'] = theUid;
          theUid.isDuplicated = false;
        } else {
          theLatestUid = uid_check[theUid.uid + '_latestUid'];
          for (j = 0; j < theUid.serviceProviders.length; j++) {
            duplicatedServiceProvider = theUid.serviceProviders[j];
            theLatestUid.serviceProviders.push(duplicatedServiceProvider);
          }
          theUid.isDuplicated = true;
        }
      };

      for (i = uids.length - 1; i >= 0; i--) {
        if (uids[i].isDuplicated) {
          uids.splice(i, 1);
        }
      };
      callback(uids);
    });
  }

  callSolrApi(parameters, callback) {
    this.apiManagerService.solrApiPostSearch(parameters, function (resp) {
      if (resp.success) {
        callback(resp.returnData.content);
      } else {
        self.notifier.error({message: 'Cannot connect to Solr'});
      }
    });
  }

  prepareImportLogSolrCallParameters() {
    let data = {
      format: 'json',
      graph: this.defaultDomain,
      q: 'importlog',
      is_enabled_facet: false,
      rows: 10000,
      start: 0,
      facets: '',
      isSearchAgaintsPredicate: false,
      resourceTypeFilters: []
    };

    return data;
  }

  importAll(catalog, serviceProviders) {
    let self = this,
      serviceProvider,
      uploadSession = catalog.uid,
      callFromImportAll = true;

    console.log('catalog = ', catalog);

    function syncCallImportAll() {
      serviceProvider = serviceProviders.shift();
      serviceProvider.importProcessStarted = true;
      console.log('serviceProviders = ', serviceProviders);
      self.import(
        callFromImportAll,
        uploadSession,
        catalog,
        serviceProvider,
        function (result) {
          if (result.success) {
            self.importedServiceProviders.push(serviceProvider);
            console.log('added ServiceProvider: ' + serviceProvider.title, result.success);
            if (serviceProviders.length === 0) {
              self.addConf(result.uploadedRdfDir, function (addConfResult) {
                if (addConfResult.returnData.success) {
                  self.patchData(
                    self.window.clientId,
                    result.uploadedRdfDir,
                    result.uploadedRdfDir,
                    function (patchDataResult) {
                      if (patchDataResult.success) {
                        catalog.imported = true;
                        self.broadcast();
                        self.notifier.success({message: patchDataResult.message});
                      } else {
                        self.notifier.error({message: patchDataResult.message});
                      }
                      self.clearProgressBar();
                      catalog.importProcessStarted = false;
                    }
                  );
                } else {
                  self.notifier.error({message: addConfResult.returnData.message});
                }
              });
            } else {
              syncCallImportAll();
            }
          } else {
            self.notifier.error({message: result.message});
          }
        }
      );
    }

    this.importWithServiceProviderCatalog = true;
    this.clearProgressBar();
    this.countOSLCServiceOfAllServiceProviders(
      serviceProviders,
      function (numOfOSLCService) {
        self.setupProgressBar(numOfOSLCService);
        self.importServiceProvider = serviceProvider;
        catalog.importProcessStarted = true;
        syncCallImportAll();
      }
    );
  }

  import(callFromImportAll, uploadSession, catalog, serviceProvider, callback) {
    let self = this,
      serviceNodes = serviceProvider.ServiceNodes,
      serviceNode,
      result = {
        success: false,
        message: '',
        uploadedRdfDir: ''
      };

    function syncCallImport() {
      serviceNode = serviceNodes.shift();
      self.writeOslcRdfFiles(
        uploadSession,
        serviceProvider,
        serviceNode,
        function (importResult) {
          if (importResult.success) {
            console.log('added serviceNode: ' + serviceNode.title, importResult.success);
            if (serviceNodes.length === 0) {

              if (callFromImportAll) {
                result.success = true;
                result.uploadedRdfDir = importResult.uploadedRdfDir;
                callback(result);
              } else {
                self.addConf(importResult.uploadedRdfDir, function (addConfResult) {
                  if (addConfResult.returnData.success) {
                    self.patchData(
                      self.window.clientId,
                      importResult.uploadedRdfDir,
                      importResult.uploadedRdfDir,
                      function (patchDataResult) {
                        if (patchDataResult.success) {
                          self.importedServiceProviders.push(serviceProvider);
                          serviceProvider.imported = true;
                          self.broadcast();
                          self.notifier.success({message: 'Resource of ' +
                            serviceProvider.Title + ' has been imported'});
                        } else {
                          result.message = patchDataResult.message;
                          self.notifier.error({message: patchDataResult.message});
                        }
                        self.clearProgressBar();
                        catalog.importProcessStarted = false;
                      }
                    );
                  } else {
                    result.message = addConfResult.returnData.message;
                    self.notifier.error({message: addConfResult.returnData.message});
                    if (callback) { callback(result); }
                  }
                });
              }
            } else {
              syncCallImport();
            }
          } else {
            result.message = importResult.message;
            if (callback) { callback(result); }
          }
        }
      );
    }

    this.importWithServiceProviderCatalog = false;
    this.clearProgressBar();
    this.countOSLCServiceOfSpecificServiceProvider(
      serviceProvider,
      function (numOfOSLCService) {
        self.setupProgressBar(numOfOSLCService);
        self.importServiceProvider = serviceProvider;
        catalog.importProcessStarted = true;
        serviceProvider.importProcessStarted = true;
        syncCallImport();
      }
    );
  }

  writeOslcRdfFiles(uploadSession, serviceProvider, serviceNode, callback) {
    let self = this,
      notAcceptedServiceNode,
      result = {
        success: false,
        message: ''
      };

    notAcceptedServiceNode =
      serviceProvider.imported === true ||
      serviceNode === undefined ||
      serviceNode.queryBaseStatus === false ||
      serviceNode.type !== 'queryCapability' ||
      serviceNode.queryBaseRdf === undefined ||
      serviceNode.queryBaseRdf === null ||
      serviceNode.queryBaseRdf === '';

    if (!notAcceptedServiceNode) {
      self.writeOslcRdfFilesAtServer(uploadSession, serviceNode, function (writeOslcResult) {
        if (writeOslcResult.success) {
          let processName = 'Importing ServiceProvider=' + serviceProvider.Title,
            processStatus = true,
            processStatusText = serviceNode.title;

          self.addProgressBar(
            processName,
            processStatus,
            processStatusText
          );

          result.success = true;
          result.uploadedRdfDir = writeOslcResult.uploadedRdfDir;
          callback(result);
        } else {
          result.message = serviceNode.title + ' cannot be imported';
          callback(result);
        }
      });
    } else {
      result.message = 'serviceNode is not valid';
      callback(result);
    }
  }

  writeOslcRdfFilesAtServer(uploadSession, theServiceNode, callback) {
    let self = this,
      params = {
        serviceProvider: this.importServiceProvider,
        serviceNode: theServiceNode,
        serviceProviderCatalogURI: this.importServiceProvider.catalogUri,
        importWithServiceProviderCatalog: this.importWithServiceProviderCatalog,
        serviceProviderCatalogUID: this.importServiceProvider.catalogUid,
        uniquePath: uploadSession,
        rdfContent: theServiceNode.queryBaseRdf
      };

    this.apiManagerService.fusekiApiPostWriteOslcRdfFilesAtServer(params, function (result) {
      console.log('fusekiApiPostWriteOslcRdfFilesAtServer() result = ', result);
      if (result.returnData.success) {
        self.genConf(
          self.window.clientId, result.returnData.uploadedRdfDir,
          result.returnData.uploadedRdfDir,
          function (patchConfResult) {
            patchConfResult.uploadedRdfDir = result.returnData.uploadedRdfDir;
            callback(patchConfResult);
          }
        );
      } else {
        callback(result.returnData);
      }
    });
  }

  patchData(clientId, uploadedRdfDir, patchDir, callback) {
    let self = this,
      result = {
        success: false,
        message: ''
      };

    console.log('patchData() clientId = ', clientId);
    console.log('patchData() uploadedRdfDir = ', uploadedRdfDir);
    console.log('patchData() patchDir = ', patchDir);
    this.stopDatastore(function (stopSuccess) {
      if (stopSuccess) {
        self.timeout(function () {
          self.startDatastore(function (startSuccess) {
            if (startSuccess) {
              let generatedDataPatchDir =
                patchDir.replace('_generatedConfPatch', '_generatedDataPatch');

              self.genData(
                clientId,
                uploadedRdfDir,
                'json:insert',
                generatedDataPatchDir,
                function (genDataResult) {
                  if (genDataResult.returnData.success) {
                    self.addData(
                      genDataResult.returnData.generatedDataPatchDir,
                      self.datasetSearchScope,
                      'json', function (addDataResult) {
                      if (addDataResult.returnData.success) {
                        self.addLog(
                          self.sessionManagerService.get('profile').organization,
                          self.sessionManagerService.get('profile').email, addDataResult.returnData.patchedStmts,
                          function (logResult) {
                            if (logResult.returnData.success) {
                              result.success = true;
                              result.message = 'RDF/XML Imported';
                              callback(result);
                            } else {
                              result.message = logResult.returnData.message;
                              callback(result);
                            }
                          });
                      } else {
                        result.message = addDataResult.returnData.message;
                        callback(result);
                      }
                    });
                  } else {
                    result.message = genDataResult.returnData.message;
                    callback(result);
                  }
                });
            } else {
              result.message = 'Datastore cannot be started';
              callback(result);
            }
          });
        }, 200);
      } else {
        result.message = 'Graph database cannot be stopped';
        callback(result);
      }
    });
  }

  disconnectedOSLCAdapter() {
    this.serviceProvidersResponse.status = false;
    this.serviceProvidersResponse.response = '';
    this.serviceProvidersResponse.serviceProviders = [];
  }

  cleanupDB() {
    let status = 'yes',
      progressTotalItem = 5,
      processName = 'Deleting all triples',
      processStatus = '',
      processStatusText = '';

    alert('Do you want to delete all triples?');
    if (status !== 'yes') return;

    this.setupProgressBar(progressTotalItem);
    this.addProgressBar(
      processName,
      processStatus,
      processStatusText
    );
    // call clean db ้here
  }
}

ImportOSLCController.$inject = ['$rootScope',
                                '$window',
                                '$scope',
                                '$http',
                                '$location',
                                '$timeout',
                                '$q',
                                'apiManagerService',
                                'notificationManagerService',
                                'sessionManagerService'
                                ];
