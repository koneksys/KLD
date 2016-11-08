
export default class AppStoreController {
  constructor($uibModal, $scope, $rootScope, $window, $location, $route,
    apiManagerService, notificationManagerService, sessionManagerService) {
    this.s = $scope;
    this.r = $rootScope;
    this.modal = $uibModal;
    this.window = $window;
    this.location = $location;
    this.route = $route;
    this.apiManager = apiManagerService;
    this.notifier = notificationManagerService;
    this.sessionManagerService = sessionManagerService;
    this.loadProfile();
    this.authorizedApps;
  }

  loadProfile() {
    let self = this;

    this.authorizedApps = [];
    this.profile = this.sessionManagerService.get('profile');
    Object.keys(this.profile.authorizations).forEach(function (auth) {
      if (auth !== 'dashboard') {
        self.authorizedApps.push({name: auth, isInstalled: self.profile.authorizations[auth]});
      }
    });
  }

  install(key) {
    let self = this;

    this.apiManager.provisioningApiPostAppstore(key, 'install', function (response) {
      if (response.returnData.success) {
        self.sessionManagerService.set('profile', response.returnData.entity);
        self.loadProfile();
        self.r.$broadcast('reloadProfile', {});
        self.window.location.reload();
      } else {
        self.notifier.error({message: response.returnData.message});
      }
    });
  }

  uninstall(key) {
    let self = this;

    this.apiManager.provisioningApiPostAppstore(key, 'uninstall', function (response) {
      if (response.returnData.success) {
        self.sessionManagerService.set('profile', response.returnData.entity);
        self.loadProfile();
        self.r.$broadcast('reloadProfile', {});
        self.window.location.reload();
      } else {
        self.notifier.error({message: response.returnData.message});
      }
    });
  }

}

AppStoreController.$inject = ['$uibModal',
                               '$scope',
                               '$rootScope',
                               '$window',
                               '$location',
                               '$route',
                               'apiManagerService',
                               'notificationManagerService',
                               'sessionManagerService'];
