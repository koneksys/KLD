import LoginDialogController from './loginDialog.controller';

export default class LoginController {
  constructor($uibModal, $window, $location, $translate, store, jwtHelper, sessionManagerService) {
    let token;

    this.modal = $uibModal;
    this.window = $window;
    this.location = $location;
    this.translate = $translate;
    this.store = store;
    this.sessionManagerService = sessionManagerService;
    this.errorMessage = '';
    this.product = this.window.product;
    this.clientBuild = this.window.clientBuild;
    this.developerWebsite = this.window.developerWebsite;
    this.developerOrg = this.window.developerOrg;

    token = this.sessionManagerService.get('token');
    if (token) {
      if (!jwtHelper.isTokenExpired(token)) {
        this.location.path('/home');
      } else {
        this.location.path('/login');
      }
    } else {
      this.location.path('/login');
    }
  }

  login() {
    this.openModalDialog();
  }

  lang(key) {
    this.translate.use(key);
  }

  openModalDialog() {
    this.modal.open({
      animation: true,
      template: require('./loginDialog.html'),
      controller: LoginDialogController,
      controllerAs: 'dialog',
      backdrop: 'static',
      windowClass: 'modal-fullscreen'
    });
  }
}

LoginController.$inject = ['$uibModal',
                           '$window',
                           '$location',
                           '$translate',
                           'store',
                           'jwtHelper',
                           'sessionManagerService'];
