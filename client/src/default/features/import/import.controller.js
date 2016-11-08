
export default class ImportController {
  constructor($rootScope, $window, $location, apiManagerService, notificationManagerService, sessionManagerService) {
    let self = this;

    this.r = $rootScope;
    this.window = $window;
    this.location = $location;
    this.apiManagerService = apiManagerService;
    this.notifier = notificationManagerService;
    this.sessionManagerService = sessionManagerService;
    this.latest20ImportLogs;
    this.listLog();
    this.r.$on('refreshUI', function (event, args) {
      self.listLog();
    });
  }

  importedFileBasedUrl() {
    return this.location.protocol() + '://' + this.location.host() + ':3002' +
      '/organization/importedfile/' + this.window.clientId;
  }

  listLog(callback) {
    let self = this;

    this.apiManagerService.provisioningApiListLog(
      self.sessionManagerService.get('profile').organization,
      self.sessionManagerService.get('profile').email,
      function (result) {
        // self.notifier.success({message: 'ImportApp: Import Logs Loaded'});
        self.latest20ImportLogs = result.returnData.entities;
        if (callback) { callback(result); }
      });
  }
}

ImportController.$inject = ['$rootScope',
                            '$window',
                            '$location',
                            'apiManagerService',
                            'notificationManagerService',
                            'sessionManagerService'];
