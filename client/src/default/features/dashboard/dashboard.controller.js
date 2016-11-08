
export default class DashboardController {
  constructor($uibModal, $scope, $rootScope, $window, $location,
    apiManagerService, notificationManagerService, sessionManagerService) {
    this.s = $scope;
    this.r = $rootScope;
    this.modal = $uibModal;
    this.window = $window;
    this.location = $location;
    this.apiManager = apiManagerService;
    this.notifier = notificationManagerService;
    this.sessionManagerService = sessionManagerService;
    this.authorizedApps;
    this.loadAuthorizedApps();
  }

  loadAuthorizedApps() {
    let self = this,
      authorizations = this.sessionManagerService.get('profile').authorizations,
      apps = Object.keys(authorizations);

    self.authorizedApps = [];
    apps.forEach(function (appName, index) {
      if (authorizations[appName] && appName !== 'dashboard' && appName !== 'importfile' && appName !== 'linking') {
        self.authorizedApps.push({name: appName});
      }
    });
  }

  openApp(appName) {
    if (appName !== 'dashboard' && appName !== 'importfile' && appName !== 'linking') {
      window.open('/' + appName);
    } else {
      this.r.$broadcast('openApp', {appName: appName});
    }
  }
}

DashboardController.$inject = ['$uibModal',
                               '$scope',
                               '$rootScope',
                               '$window',
                               '$location',
                               'apiManagerService',
                               'notificationManagerService',
                               'sessionManagerService'];
