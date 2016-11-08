import ViewRdfDialogController from './viewRdfDialog.controller';
import conf from '../../app.json';

export default class ImportFileController {

  constructor($uibModal, apiManagerService, notificationManagerService, sessionManagerService,
    FileUploader, $scope, $rootScope, $window, $timeout, $log, $location) {
    let self = this;

    this.modal = $uibModal;
    this.apiManagerService = apiManagerService;
    this.notifier = notificationManagerService;
    this.sessionManagerService = sessionManagerService;
    this.scope = $scope;
    this.r = $rootScope;
    this.window = $window;
    this.timeout = $timeout;
    this.log = $log;
    this.location = $location;
    this.domain = this.sessionManagerService.get('org').domain +
      '/' + this.sessionManagerService.get('profile').email + '/default';
    this.defaultDomain = this.domain;
    this.datasetSearchScope = this.domain;
    this.processingFiles = [];
    this.invalidProcessingFiles = [];
    this.validProcessingFiles = [];
    this.uploaded = false;
    this.inprogress = false;
    this.imported = false;
    this.provisioningName = this.window.clientId;
    this.provisioningConf = '';
    this.showAdminToolbar = true;
    this.countInvalidProcessingFiles = 0;
    this.countValidProcessingFiles = 0;
    this.importErrorMessage = '';
    this.stepProgressText = '%';
    this.stepProgressBar;
    this.stepProgressClass = '';
    this.alerts = [];
    this.maxImportFileSizeInBytes = conf.maxImportFileSizeInBytes;
    this.maxImportFileSizeInKBytes = conf.maxImportFileSizeInBytes / 1000;
    this.maxImportFileSizeText =
      this.maxImportFileSizeInKBytes < 1000 ?
      this.maxImportFileSizeInKBytes + 'KB' :
      (this.maxImportFileSizeInKBytes / 1000) + 'MB';
    this.uploader = this.scope.uploader = new FileUploader({
      url: this.location.protocol() + '://' + this.location.host() + ':3002' + '/api/file.upload',
      headers: {
        'x-access-token': self.sessionManagerService.get('token'),
        profile: self.sessionManagerService.get('profile'),
        'client-id': self.window.clientId
      }
    });

    this.uploader.filters.push({
      name: 'customFilter',
      fn: function (item, options) {
        return this.queue.length < 1000;
      }
    });

    this.uploader.onWhenAddingFileFailed = function (item, filter, options) {
      // console.log('onWhenAddingFileFailed', item, filter, options);
    };
    this.uploader.onAfterAddingFile = function (fileItem) {
      // console.log('onAfterAddingFile', fileItem);
      self.importErrorMessage = '';
      console.log('onAfterAddingFile', fileItem);
      console.log('self.uploader.queue BEFORE', self.uploader.queue);
      if (fileItem.file.size > self.maxImportFileSizeInBytes) {
        alert('Maximum file size is ' + self.maxImportFileSizeInKBytes + 'KB. ' +
        fileItem.file.name + '(' + (fileItem.file.size / 1000) + 'MB) is exceed the limit');
        console.log('self.uploader.queue.length', self.uploader.queue.length);
        self.uploader.queue.splice(self.uploader.queue.length - 1, 1);
        console.log('self.uploader.queue AFTER', self.uploader.queue);
        self.scope.$apply();
      }
    };
    this.uploader.onAfterAddingAll = function (addedFileItems) {
      // console.log('onAfterAddingAll', addedFileItems);
    };
    this.uploader.onBeforeUploadItem = function (item) {
      // console.log('onBeforeUploadItem', item);
    };
    this.uploader.onProgressItem = function (fileItem, progress) {
      // console.log('onProgressItem', fileItem, progress);
    };
    this.uploader.onProgressAll = function (progress) {
      // console.log('onProgressAll', progress);
    };
    this.uploader.onSuccessItem = function (fileItem, response, status, headers) {
      // console.log('onSuccessItem', fileItem, response, status, headers);
    };
    this.uploader.onErrorItem = function (fileItem, response, status, headers) {
      // console.log('onErrorItem', fileItem, response, status, headers);
    };
    this.uploader.onCancelItem = function (fileItem, response, status, headers) {
      // console.log('onCancelItem', fileItem, response, status, headers);
    };
    this.uploader.onCompleteItem = function (fileItem, response, status, headers) {
      console.log('onCompleteItem', fileItem, response, status, headers);
      if (response.success === false) {
        self.countInvalidProcessingFiles++;
        self.invalidProcessingFiles.push({
          response: response
        });
      } else {
        self.countValidProcessingFiles++;
        self.validProcessingFiles.push({
          response: response
        });
      }
      self.processingFiles.push({
        response: response
      });
    };
    this.uploader.onCompleteAll = function () {
      console.log('onCompleteAll');
      console.log('onCompleteAll this.countInvalidProcessingFiles = ', self.countInvalidProcessingFiles);
      console.log('onCompleteAll this.processingFiles = ', self.processingFiles);
      self.timeout(function () {
        self.uploaded = true;
        if (self.validProcessingFiles.length > 0) {
          self.importAll();
        } else {
          self.notifier.warning({message: 'Not found valid files'});
          self.timeout(function () {
            self.removeAllProcessingFile();
          }, 3000);
        }
      }, 1000);
    };
  }

  removeProcessingFile(index) {
    this.processingFiles.splice(index, 1);
    this.uploader.queue.splice(index, 1);

    if (this.processingFiles.length === 0 && this.uploader.queue.length === 0) {
      this.uploader.clearQueue();
    }
  }

  removeAllProcessingFile() {
    let i = 0;

    for (i = this.processingFiles.length - 1; i >= 0; i--) {
      this.processingFiles.splice(i, 1);
    }

    this.uploader.clearQueue();

    this.processingFiles = [];
    this.invalidProcessingFiles = [];
    this.validProcessingFiles = [];
    this.countInvalidProcessingFiles = 0;
    this.countValidProcessingFiles = 0;
    this.uploaded = false;
  }

  countProcessingFiles() {
    return Object.keys(this.processingFiles).length;
  }

  getProcessingFiles() {
    return this.processingFiles;
  }

  getAPIServerBaseUrl() {
    return this.location.protocol() + '://' + this.location.host() + ':3002';
  }

  broadcast() {
    this.r.$broadcast('refreshUI', {});
  }

  getClientProvisioning(callback) {
    this.apiManagerService.provisioningLoadConfOnAPIServer(function (result) {
      if (callback) { callback(JSON.stringify(result.returnData, null, 2)); }
    });
  }

  deleteProvisioningDatabase() {
    let self = this;

    this.inprogress = true;
    this.apiManagerService.provisioningApiDeleteDatabase(function (result) {
      console.log('result = ', result);
      if (result.returnData.success) {
        self.notifier.success({message: result.returnData.message});
      } else {
        self.notifier.error({message: result.returnData.message});
      }
      self.inprogress = false;
    });
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

  addProvisioning() {
    let self = this;

    this.inprogress = true;
    this.apiManagerService.provisioningApiAddProvisioning(function (result) {
      console.log('result = ', result);
      if (result.returnData.success) {
        self.notifier.success({message: result.returnData.message});
      } else {
        self.notifier.error({message: result.returnData.message});
      }
      self.inprogress = false;
    });
  }

  deleteProvisioning() {
    let self = this;

    this.inprogress = true;
    this.apiManagerService.provisioningApiDeleteProvisioning(function (result) {
      if (result.returnData.success) {
        self.notifier.success({message: result.returnData.message});
      } else {
        self.notifier.error({message: result.returnData.message});
      }
      self.inprogress = false;
    });
  }

  prepareConfDir(files, dirPath, callback) {
    this.apiManagerService.provisioningApiPrepareConfDir(files, dirPath, function (result) {
      if (callback) { callback(result); }
    });
  }

  convertCsvToRdfXml(csvFileName, csvFileDir, callback) {
    this.apiManagerService.provisioningApiPostConvertCsvToRdfXml(csvFileName, csvFileDir, function (result) {
      if (callback) { callback(result); }
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

  view(processingFile) {
    let self = this;

    this.apiManagerService.apiPostFileDownload(processingFile.response.file, function (result) {
      if (result.success) {
        self.modal.open({
          animation: true,
          template: require('./viewRdfDialog.html'),
          controller: ViewRdfDialogController,
          controllerAs: 'dialog',
          backdrop: 'static',
          size: 'lg',
          resolve: {
            data: function () {
              return {title: processingFile.response.file.originalname, rdf: result.returnData.content};
            }
          }
        });
      }
    });
  }

  importAll() {
    let files = [],
      dirPath,
      self = this;

    this.imported = false;
    this.inprogress = true;
    this.validProcessingFiles.forEach(function (object, index) {
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
      console.log('file(' + index + ')', object);
      files.push(object.response.file);
      dirPath = object.response.file.destination;
    });

    dirPath += this.window.clientId;
    console.log('files = ', files);
    console.log('dirPath = ', dirPath);
    this.prepareConfDir(files, dirPath, function (prepareResult) {
      if (prepareResult.returnData.success) {
        if (prepareResult.returnData.format === 'rdf') {
          self.stepProgressBar = 10;
          self.process(
            self.window.clientId,
            prepareResult.returnData.rdfDir,
            prepareResult.returnData.outputDir);
        } else if (prepareResult.returnData.format === 'csv') {
          let userCsvFileName = self.sessionManagerService.get('profile').email +
            '_' + prepareResult.returnData.fileName;

          self.convertCsvToRdfXml(
            userCsvFileName,
            prepareResult.returnData.fileDir,
            function (convertResult) {
              if (convertResult.success) {
                self.process(
                  self.window.clientId,
                  prepareResult.returnData.rdfDir,
                  prepareResult.returnData.outputDir);
              } else {
                let errorMsg = 'Error found in convertCsvToRdfXml process';

                self.notifier.error({message: errorMsg});
                self.inprogress = false;
              }
            }
          );
        } else {
          let errorMsg = 'The prepared file format = ' +
            prepareResult.returnData.format + ' is not supported';

          self.notifier.error({message: errorMsg});
          self.inprogress = false;
        }
      } else {
        self.notifier.error({message: prepareResult.returnData.message});
        self.inprogress = false;
      }
    });
  }

  process(clientId, uploadedRdfDir, outputDir) {
    let self = this;

    this.genConf(
      clientId,
      uploadedRdfDir,
      outputDir,
      function (genResult) {
        if (genResult.returnData.success) {
          self.stepProgressBar = 20;
          self.addConf(genResult.returnData.patchDir, function (patchResult) {
            if (patchResult.returnData.success) {
              self.stepProgressBar = 40;
              self.stopDatastore(function (stopSuccess) {
                if (stopSuccess) {
                  self.stepProgressBar = 50;
                  self.timeout(function () {
                    self.startDatastore(function (startSuccess) {
                      if (startSuccess) {
                        let generatedDataPatchDir =
                          genResult.returnData.patchDir.replace('_generatedConfPatch', '_generatedDataPatch');

                        self.stepProgressBar = 60;
                        self.genData(
                          clientId,
                          uploadedRdfDir,
                          'json:insert',
                          generatedDataPatchDir,
                          function (genDataResult) {
                            if (genDataResult.returnData.success) {
                              self.stepProgressBar = 80;
                              self.addData(
                                genDataResult.returnData.generatedDataPatchDir,
                                self.datasetSearchScope,
                                'json', function (addDataResult) {
                                if (addDataResult.returnData.success) {
                                  self.log.debug('addDataResult.returnData = ', addDataResult.returnData);
                                  self.addLog(
                                    self.sessionManagerService.get('profile').organization,
                                    self.sessionManagerService.get('profile').email,
                                    addDataResult.returnData.patchedStmts,
                                    function (logResult) {
                                      if (logResult.returnData.success) {
                                        self.broadcast();
                                        self.removeAllProcessingFile();
                                        self.stepProgressBar = 100;
                                        self.stepProgressText = 'RDF/XML Imported';
                                        self.imported = true;
                                        self.notifier.success({message: 'RDF/XML Imported'});
                                        self.inprogress = false;
                                        self.importErrorMessage = '';
                                      } else {
                                        self.notifier.error({message: logResult.returnData.message});
                                        self.importErrorMessage = logResult.returnData.message;
                                        self.inprogress = false;
                                        self.removeAllProcessingFile();
                                      }
                                    });
                                } else {
                                  self.notifier.error({message: addDataResult.returnData.message});
                                  self.importErrorMessage = addDataResult.returnData.message;
                                  self.inprogress = false;
                                  self.removeAllProcessingFile();
                                }
                              });
                            } else {
                              self.notifier.error({message: genDataResult.returnData.message});
                              self.importErrorMessage = genDataResult.returnData.message;
                              self.inprogress = false;
                              self.removeAllProcessingFile();
                            }
                          });
                      } else {
                        self.notifier.error({message: 'Datastore is not running'});
                        self.importErrorMessage = 'Datastore is not running';
                        self.inprogress = false;
                        self.removeAllProcessingFile();
                      }
                    });
                  }, 3000);
                } else {
                  self.notifier.error({message: 'Cannot connect to datastore'});
                  self.importErrorMessage = 'Cannot connect to datastore';
                  self.removeAllProcessingFile();
                  self.inprogress = false;
                }
              });
            } else {
              self.notifier.error({message: patchResult.returnData.message});
              self.importErrorMessage = patchResult.returnData.message;
              self.removeAllProcessingFile();
              self.inprogress = false;
            }
          });
        } else {
          self.notifier.error({message: genResult.returnData.message});
          self.importErrorMessage = genResult.returnData.message;
          self.removeAllProcessingFile();
          self.inprogress = false;
        }
      }
    );
  }

}

ImportFileController.$inject = ['$uibModal',
                                'apiManagerService',
                                'notificationManagerService',
                                'sessionManagerService',
                                'FileUploader',
                                '$scope',
                                '$rootScope',
                                '$window',
                                '$timeout',
                                '$log',
                                '$location'];
