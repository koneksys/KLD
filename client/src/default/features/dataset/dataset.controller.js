
export default class DatasetController {
  constructor($window,
              $sce,
              $location,
              $log,
              $scope,
              $rootScope,
              $timeout,
              apiManagerService,
              notificationManagerService,
              sessionManagerService) {
    let self = this;

    this.window = $window;
    this.location = $location;
    this.scope = $scope;
    this.r = $rootScope;
    this.timeout = $timeout;
    this.sessionManagerService = sessionManagerService;
    this.log = $log;
    this.email = this.sessionManagerService.get('profile').email;
    this.organization = this.sessionManagerService.get('profile').organization;
    this.domain = this.sessionManagerService.get('org').domain;
    this.defaultDatasetDomain = this.domain + '/' + this.email + '/MyDataSet';
    this.emailForVanityUrl = this.email.replace('@', '_at_');
    this.datasetIdentifierInputType = 'userIdentifier';
    this.apiManager = apiManagerService;
    this.notifier = notificationManagerService;
    this.r.foundDatasetProfile = false;
    this.r.datasetProfiles;
    this.validationMessage = '';
    this.identiferOfNewDataset = this.defaultDatasetDomain;
    this.descriptionOfNewDataset = 'My dataset';
    this.licenseOfNewDataset = 'CC';
    this.refreshDatasets();
    this.generateIdentiferId();
    this.defaultDomain = this.domain + '/' + this.email + '/default';

    this.scope.$on('refreshUI', function (event, args) {
      self.refreshDatasets();
    });
  }

  generateIdentiferId() {
    this.generatedIdentiferId = this.domain + '/' + this.email + '/' + this.uuid();
    this.datasetIdentifierInputType = 'userIdentifier';
  }

  refreshDatasets() {
    let self = this;

    this.loadDatasetProfile(function (result) {
      if (result.entities.length > 0) {
        self.r.foundDatasetProfile = true;
        self.r.datasetProfiles = result.entities;
      } else {
        self.datasetIdentifierInputType = 'manually';
        self.identiferOfNewDataset = self.defaultDomain;
        self.descriptionOfNewDataset = 'default dataset';
        self.licenseOfNewDataset = self.domain + '/license';
        self.addNewDatasetProfile();
      }
    });
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

  loadDatasetProfile(callback) {
    this.apiManager.datasetApiLoad({}, function (result) {
      callback(result.returnData);
    });
  }

  stripTrailingSlash(text) {
    return text.replace(/\/+$/, '');
  }

  addNewDatasetProfile() {
    let self = this,
      params = {
        identifier: '',
        description: this.descriptionOfNewDataset.trim(),
        license: this.licenseOfNewDataset.trim()
      };

    if (this.datasetIdentifierInputType === 'userIdentifier') {
      params.identifier = this.identiferOfNewDataset.trim();
    } else if (this.datasetIdentifierInputType === 'userGeneratedVanityUrl') {
      params.identifier = this.generatedIdentiferId;
    } else {
      params.identifier = this.identiferOfNewDataset.trim();
    }

    this.apiManager.datasetApiAdd(params, function (result) {
      if (result.returnData.success) {
        self.generateIdentiferId();
        self.notifier.success({message: 'DatasetApp: New Dataset Created'});
        // self.timeout(function () {
        //   self.r.$broadcast('initiateProvisioning', {});
        // }, 3000);
      }
    });

  }

}

DatasetController.$inject = ['$window',
                          '$sce',
                          '$location',
                          '$log',
                          '$scope',
                          '$rootScope',
                          '$timeout',
                          'apiManagerService',
                          'notificationManagerService',
                          'sessionManagerService'
                         ];
