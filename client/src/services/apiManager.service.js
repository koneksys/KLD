import angular from 'angular';

import notificationManagerService from './notificationManager.service';
import logManagerService from './logManager.service';
import sessionManagerService from './sessionManager.service';

class ApiManager {
  constructor($http, $window, $rootScope, $location, store,
    notificationManagerService, logManagerService, sessionManagerService) {
    this.http = $http;
    this.r = $rootScope;
    this.location = $location;
    this.store = store;
    this.window = $window;
    this.notifier = notificationManagerService;
    this.logger = logManagerService;
    this.sessionManagerService = sessionManagerService;
    this.HTTP_TIMEOUT_IN_MSEC = 9000000;
  }

  getAPIServerBaseUrl() {
    return this.location.protocol() + '://' + this.location.host() + ':3002';
  }

  authen(org, email, password, callback) {
    let self = this,
      response = {},
      url = this.getAPIServerBaseUrl() + '/security/authen';

    this.http({
      url: url,
      method: 'post',
      data: {org: org, email: email, password: password, clientId: self.window.clientId},
      timeout: this.HTTP_TIMEOUT_IN_MSEC
    }).then(function successCallback(resp) {
      console.log('APIManager success', resp);
      response.success = true;
      response.returnData = resp.data;
      if (callback) { callback(response); };
    }, function errorCallback(resp) {
      console.log('APIManager error', resp);
      if (resp.status === -1) {
        self.notifier.error(
          {message: 'API-SERVER: Cannot connect to api server'});
      } else {
        self.notifier.error(
          {message: 'API-SERVER: HTTP ' + resp.status + ' ' +
                    resp.statusText + '<br>' + url + '<br>[' + JSON.stringify(resp.data) + ']'});
      }
    });
  }

  setWindowObject(key, value) {
    if (!window.m) window.m = {};
    window.m[key] = value;
  }

  buildQueryString(queryVars) {
    let query;
    let url = '';

    if (queryVars === undefined) {
      queryVars = {};
    }

    if (queryVars) {
      url += '?clientId=' + this.window.clientId + '&email=' + this.sessionManagerService.get('profile').email +
             '&clientBuild=' + this.window.clientBuild;
      for (query in queryVars) {
        url += '&' + query + '=' + queryVars[query];
      }
    }
    return url;
  }

  getOrganizations(callback) {
    let self = this,
      response = {},
      url = this.getAPIServerBaseUrl() + '/organization/list/' + self.window.clientId;

    this.http({
      url: url,
      method: 'get',
      timeout: this.HTTP_TIMEOUT_IN_MSEC
    }).then(function successCallback(resp) {
      console.log('APIManager success', resp);
      response.success = true;
      response.returnData = resp.data;
      if (callback) { callback(response); };
    }, function errorCallback(resp) {
      console.log('APIManager error', resp);
      if (resp.status === -1) {
        self.notifier.error(
          {message: 'API-SERVER: Cannot connect to api server'});
      } else {
        self.notifier.error(
          {message: 'API-SERVER: HTTP ' + resp.status + ' ' +
                    resp.statusText + '<br>' + url + '<br>[' + JSON.stringify(resp.data) + ']'});
      }
    });
  }

  emailPostSend(senderName, senderEmail, recieptEmail, subject, contentPlainText, contentHTML, callback) {
    let url = this.getAPIServerBaseUrl() + '/api/email/send';
    let method = 'POST';
    let inputData = {};

    inputData.senderName = senderName;
    inputData.senderEmail = senderEmail;
    inputData.recieptEmail = recieptEmail;
    inputData.subject = subject;
    inputData.contentPlainText = contentPlainText;
    inputData.contentHTML = contentHTML;
    this.callAPI(url, method, inputData, function (resp) {
      if (callback) { callback(resp); };
    });
  }

  apiPostFileDownload(file, callback) {
    let url = this.getAPIServerBaseUrl() + '/file.download';
    let method = 'POST';
    let inputData = {};

    inputData.file = file;
    this.callAPI(url, method, inputData, function (resp) {
      if (callback) { callback(resp); };
    });
  }

  provisioningApiPostConvertCsvToRdfXml(csvFileName, csvFileDir, callback) {
    let url = this.getAPIServerBaseUrl() + '/api/provisioning/convert.csv2rdfxml';
    let method = 'POST';
    let inputData = {};

    inputData.csvFileName = csvFileName;
    inputData.csvFileDir = csvFileDir;
    this.callAPI(url, method, inputData, function (resp) {
      if (callback) { callback(resp); };
    });
  }

  provisioningApiPostAppstore(app, operation, callback) {
    let url = this.getAPIServerBaseUrl() + '/api/provisioning/provisioning.appstore';
    let method = 'POST';
    let inputData = {};

    inputData.app = app;
    inputData.operation = operation;
    this.callAPI(url, method, inputData, function (resp) {
      if (callback) { callback(resp); };
    });
  }

  provisioningLoadConfOnAPIServer(callback) {
    let url = this.getAPIServerBaseUrl() + '/api/provisioning/provisioning.conf';
    let method = 'POST';
    let inputData = {};

    this.callAPI(url, method, inputData, function (resp) {
      if (callback) { callback(resp); };
    });
  }

  provisioningApiDeleteDatabase(callback) {
    let url = this.getAPIServerBaseUrl() + '/api/provisioning/provisioning.db.delete';
    let method = 'POST';
    let inputData = {};

    this.callAPI(url, method, inputData, function (resp) {
      if (callback) { callback(resp); };
    });
  }

  provisioningApiPrepareConfDir(files, dirPath, callback) {
    let url = this.getAPIServerBaseUrl() + '/api/provisioning/conf.prepare.dir';
    let method = 'POST';
    let inputData = {};

    inputData.files = files;
    inputData.dirPath = dirPath;
    this.callAPI(url, method, inputData, function (resp) {
      if (callback) { callback(resp); };
    });
  }

  provisioningApiStartDatastore(callback) {
    let url = this.getAPIServerBaseUrl() + '/api/provisioning/datastore.start';
    let method = 'POST';
    let inputData = {};

    this.callAPI(url, method, inputData, function (resp) {
      if (callback) { callback(resp); };
    });
  }

  provisioningApiStopDatastore(callback) {
    let url = this.getAPIServerBaseUrl() + '/api/provisioning/datastore.stop';
    let method = 'POST';
    let inputData = {};

    this.callAPI(url, method, inputData, function (resp) {
      if (callback) { callback(resp); };
    });
  }

  provisioningApiAddProvisioning(callback) {
    let url = this.getAPIServerBaseUrl() + '/api/provisioning/provisioning.add';
    let method = 'POST';
    let inputData = {};

    this.callAPI(url, method, inputData, function (resp) {
      if (callback) { callback(resp); };
    });
  }

  provisioningApiDeleteProvisioning(callback) {
    let url = this.getAPIServerBaseUrl() + '/api/provisioning/provisioning.delete';
    let method = 'POST';
    let inputData = {};

    this.callAPI(url, method, inputData, function (resp) {
      if (callback) { callback(resp); };
    });
  }

  provisioningApiDeleteProvisioningWithoutCleanupUserDataset(callback) {
    let url = this.getAPIServerBaseUrl() + '/api/provisioning/provisioning.delete.without.datasetcleanup';
    let method = 'POST';
    let inputData = {};

    this.callAPI(url, method, inputData, function (resp) {
      if (callback) { callback(resp); };
    });
  }

  provisioningApiGenConf(graphName, rdfDir, outputDir, callback) {
    let url = this.getAPIServerBaseUrl() + '/api/provisioning/conf.gen';
    let method = 'POST';
    let inputData = {};

    inputData.graphName = graphName;
    inputData.rdfDir = rdfDir;
    inputData.outputDir = outputDir;
    this.callAPI(url, method, inputData, function (resp) {
      if (callback) { callback(resp); };
    });
  }

  provisioningApiAddConf(patchDir, callback) {
    let url = this.getAPIServerBaseUrl() + '/api/provisioning/conf.add';
    let method = 'POST';
    let inputData = {};

    inputData.patchDir = patchDir;
    this.callAPI(url, method, inputData, function (resp) {
      if (callback) { callback(resp); };
    });
  }

  provisioningApiGenData(graphName, rdfDir, format, outputDir, callback) {
    let url = this.getAPIServerBaseUrl() + '/api/provisioning/data.gen';
    let method = 'POST';
    let inputData = {};

    inputData.graphName = graphName;
    inputData.rdfDir = rdfDir;
    inputData.outputDir = outputDir;
    inputData.format = format;
    this.callAPI(url, method, inputData, function (resp) {
      if (callback) { callback(resp); };
    });
  }

  provisioningApiAddData(generatedDataPatchDir, datasetIdentifier, format, callback) {
    let url = this.getAPIServerBaseUrl() + '/api/provisioning/data.add';
    let method = 'POST';
    let inputData = {};

    inputData.generatedDataPatchDir = generatedDataPatchDir;
    inputData.datasetIdentifier = datasetIdentifier;
    inputData.format = format;
    this.callAPI(url, method, inputData, function (resp) {
      if (callback) { callback(resp); };
    });
  }

  provisioningApiAddLog(organization, email, logs, callback) {
    let url = this.getAPIServerBaseUrl() + '/api/provisioning/log.add';
    let method = 'POST';
    let inputData = {};

    inputData.organization = organization;
    inputData.email = email;
    inputData.logs = logs;
    this.callAPI(url, method, inputData, function (resp) {
      if (callback) { callback(resp); };
    });
  }

  provisioningApiListLog(organization, email, callback) {
    let url = this.getAPIServerBaseUrl() + '/api/provisioning/log.list';
    let method = 'POST';
    let inputData = {};

    inputData.organization = organization;
    inputData.email = email;
    this.callAPI(url, method, inputData, function (resp) {
      if (callback) { callback(resp); };
    });
  }

  solrApiPostSearch(solParams, callback) {
    let url = this.getAPIServerBaseUrl() + '/api/solr/search';
    let method = 'POST';
    let inputData = solParams;

    this.callAPI(url, method, inputData, function (resp) {
      if (callback) { callback(resp); };
    });
  }

  solrApiPostDelete(deletionString, callback) {
    let url = this.getAPIServerBaseUrl() + '/api/solr/delete';
    let method = 'POST';
    let inputData = {};

    inputData.deletionString = deletionString;
    this.callAPI(url, method, inputData, function (response) {
      if (callback) { callback(response); };
    });
  }

  fusekiApiPostSparqlUpdate(updateStatementWithoutGraphName, updateStatement, callback) {
    let url = this.getAPIServerBaseUrl() + '/api/fuseki/sparqlUpdate';
    let method = 'POST';
    let inputData = {};

    inputData.updateStatementWithoutGraphName = updateStatementWithoutGraphName;
    inputData.updateStatement = updateStatement;
    this.callAPI(url, method, inputData, function (resp) {
      console.log('fusekiApiPostSparqlUpdate resp = ', resp);
      if (callback) { callback(resp); };
    });
  }

  fusekiApiPostSparqlQueryWithoutProgress(params, callback) {
    let url = this.getAPIServerBaseUrl() + '/api/fuseki/sparqlQuery',
      method = 'POST',
      inputData = {
        queryStatement: params.queryStatement,
        format: params.format
      };

    inputData.disbleLoadingProgress = true;
    this.callAPI(url, method, inputData, function (resp) {
      if (callback) { callback(resp); };
    });
  }

  fusekiApiPostSparqlQuery(params, callback) {
    let url = this.getAPIServerBaseUrl() + '/api/fuseki/sparqlQuery',
      method = 'POST',
      inputData = {
        queryStatement: params.queryStatement,
        format: params.format
      };

    this.callAPI(url, method, inputData, function (resp) {
      if (callback) { callback(resp); };
    });
  }

  fusekiApiPostWriteOslcRdfFilesAtServer(params, callback) {
    let url = this.getAPIServerBaseUrl() + '/api/fuseki/writeOslcRdfFilesAtServer',
      method = 'POST',
      inputData = {
        serviceProvider: params.serviceProvider,
        serviceNode: params.serviceNode,
        serviceProviderCatalogURI: params.serviceProviderCatalogURI,
        importWithServiceProviderCatalog: params.importWithServiceProviderCatalog,
        serviceProviderCatalogUID: params.serviceProviderCatalogUID,
        uniquePath: params.uniquePath
      };

    inputData.disbleLoadingProgress = true;
    this.callAPI(url, method, inputData, function (resp) {
      if (callback) { callback(resp); };
    });
  }

  fusekiApiPostZipImportFiles(params, callback) {
    let url = this.getAPIServerBaseUrl() + '/api/fuseki/zip.import.files',
      method = 'POST',
      inputData = {
        serviceProviderCatalogUID: params.serviceProviderCatalogUID,
        importWithServiceProviderCatalog: params.importWithServiceProviderCatalog
      };

    inputData.disbleLoadingProgress = true;
    this.callAPI(url, method, inputData, function (resp) {
      if (callback) { callback(resp); };
    });
  }

  fusekiApiGetFusekiMapping(queryVars, callback) {
    let url = this.getAPIServerBaseUrl() + '/api/fuseki/fusekiMapping',
      method = 'GET',
      inputData = {};

    url += this.buildQueryString(queryVars);
    this.callAPI(url, method, inputData, function (resp) {
      if (resp.success) {
        resp.returnData = JSON.parse(resp.returnData);
        if (resp.returnData['mapping']) {
          resp.returnData.hashPrefixes = resp.returnData.mapping.prefixes;
        }
        if (callback) { callback(resp); };
      } else {
        if (callback) { callback(resp); };
      }
    });
  }

  datasetApiLoad(queryVars, callback) {
    let url = this.getAPIServerBaseUrl() + '/api/dataset',
      method = 'GET',
      inputData = {};

    url += this.buildQueryString(queryVars);
    this.callAPI(url, method, inputData, function (resp) {
      if (callback) { callback(resp); };
    });
  }

  datasetApiAdd(params, callback) {
    let url = this.getAPIServerBaseUrl() + '/api/dataset',
      method = 'POST',
      inputData = {
        identifier: params.identifier,
        description: params.description,
        license: params.license
      };

    this.callAPI(url, method, inputData, function (resp) {
      if (callback) { callback(resp); };
    });
  }

  userApiPostLoad(callback) {
    let url = this.getAPIServerBaseUrl() + '/api/user/load';
    let method = 'POST';
    let inputData = {};

    inputData.disbleLoadingProgress = true;
    this.callAPI(url, method, inputData, function (response) {
      if (callback) { callback(response); };
    });
  }

  userApiGetClientInfo(queryVars, callback) {
    let url = this.getAPIServerBaseUrl() + '/api/user/getClientInfo';
    let method = 'GET';
    let inputData = {};

    url += this.buildQueryString(queryVars);

    this.callAPI(url, method, inputData, function (response) {
      if (callback) { callback(response); };
    });
  }

  adminApiGetPing(queryVars, callback) {
    let url = this.getAPIServerBaseUrl() + '/api/admin/ping';
    let method = 'GET';
    let inputData = {};

    url += this.buildQueryString(queryVars);

    this.callAPI(url, method, inputData, function (response) {
      if (callback) { callback(response); };
    });
  }

  availabilityApiGetPing(queryVars, callback) {
    let url = this.getAPIServerBaseUrl() + '/api/availability/ping';
    let method = 'GET';
    let inputData = {};

    url += this.buildQueryString(queryVars);

    this.callAPI(url, method, inputData, function (response) {
      if (callback) { callback(response); };
    });
  }

  postFusekiSetCurrentTriples(inputData, callback) {
    let url = this.getAPIServerBaseUrl() + '/api/fuseki/setCurrentTriples/:id';
    let method = 'POST';

    this.callAPI(url, method, inputData, function (response) {
      callback(response);
    });
  }

  callAPI(url, method, inputData, callback) {
    let self = this, response = {};

    inputData.clientId = this.window.clientId;
    inputData.organization = this.sessionManagerService.get('profile').organization;
    inputData.domain = this.sessionManagerService.get('org').domain;;
    inputData.profile = this.sessionManagerService.get('profile');
    inputData.email = this.sessionManagerService.get('profile').email;
    inputData.clientBuild = this.window.clientBuild;
    response.inputData = inputData;
    // inputData.disbleLoadingProgress = true;
    if (inputData.disbleLoadingProgress) {
      this.http({
        url: url,
        method: method,
        data: inputData,
        timeout: this.HTTP_TIMEOUT_IN_MSEC,
        headers: {
          'x-access-token': self.sessionManagerService.get('token')
        }
      }).then(function successCallback(resp) {
        response.success = true;
        response.returnData = resp.data;
        if (callback) { callback(response); };
      }, function errorCallback(resp) {
        if (resp.status === -1) {
          self.notifier.error(
            {message: 'API-SERVER: Cannot connect to api server'});
          console.log(resp);
        } else {
          self.notifier.error(
            {message: 'API-SERVER: HTTP ' + resp.status + ' ' +
                      resp.statusText + '<br>' + url + '<br>[' + JSON.stringify(resp.data) + ']'});
        }
      });
    } else {
      this.r.myPromise = this.http({
        url: url,
        method: method,
        data: inputData,
        timeout: this.HTTP_TIMEOUT_IN_MSEC,
        headers: {
          'x-access-token': self.sessionManagerService.get('token')
        }
      }).then(function successCallback(resp) {
        response.success = true;
        response.returnData = resp.data;
        if (callback) { callback(response); };
      }, function errorCallback(resp) {
        if (resp.status === -1) {
          self.notifier.error(
            {message: 'API-SERVER: Cannot connect to api server'});
        } else {
          self.notifier.error(
            {message: 'API-SERVER: HTTP ' + resp.status + ' ' +
                      resp.statusText + '<br>' + url + '<br>[' + JSON.stringify(resp.data) + ']'});
        }
      });
    }
  }
}

ApiManager.$inject = ['$http',
                      '$window',
                      '$rootScope',
                      '$location',
                      'store',
                      'notificationManagerService',
                      'logManagerService',
                      'sessionManagerService'];

export default angular.module('services.api-manager', [
  notificationManagerService,
  logManagerService,
  sessionManagerService])
  .service('apiManagerService', ApiManager)
  .name;
