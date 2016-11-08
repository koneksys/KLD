
export default class LoginDialogController {

  constructor($scope, $rootScope, $window, $uibModalInstance, apiManagerService,
    sessionManagerService, $location, $log, store, $auth) {
    let self = this;

    this.apiManagerService = apiManagerService;
    this.sessionManagerService = sessionManagerService;
    this.window = $window;
    this.location = $location;
    this.store = store;
    this.authenticate = function (provider) {
      $auth.authenticate(provider);
    };
    this.modalInstance = $uibModalInstance;
    this.scope = $scope;
    this.r = $rootScope;
    this.log = $log;
    this.email = 'demo@example.com';
    this.password = 'demo';
    this.emailValidationMessage;
    this.organizations;
    this.selectedOrg = 'ExampleCompany';
    this.openRegisterForm = false;
    this.passwordValidationMessage;
    this.authenticationMessage;
    this.rememberme = true;
    this.scope.$on('closeModalDialog', function (event, args) {
      self.modalInstance.dismiss('cancel');
    });
    this.getOrgs();
  }

  clickRegister() {
    this.openRegisterForm = true;
  }

  clickLogin() {
    this.openRegisterForm = false;
  }

  getOrgs() {
    let self = this;

    this.apiManagerService.getOrganizations(function (response) {
      self.organizations = response.returnData.entities;
      console.log('getOrgs() response =', response);
    });
  }

  submit() {
    let self = this;

    console.log('org = ', this.selectedOrg);
    console.log('email = ', this.email);
    console.log('password = ', this.password);
    console.log('rememberme = ', this.rememberme);
    if (this.email === undefined) {
      this.emailValidationMessage = 'Please enter valid email address';
    } else if (this.password === undefined || this.password === '') {
      this.emailValidationMessage = '';
      this.passwordValidationMessage = 'Password cannot be empty';
    } else {
      this.passwordValidationMessage = '';
      this.apiManagerService.authen(this.selectedOrg, this.email, this.password, function (response) {
        console.log(response);
        if (response.returnData.success) {
          self.sessionManagerService.set('token', response.returnData.token);
          self.sessionManagerService.set('org', response.returnData.org);
          self.sessionManagerService.set('profile', response.returnData.profile);
          self.location.path('/home');
          self.closeDialog();
        } else {
          self.authenticationMessage = response.returnData.message;
        }
      });
    }
  }

  cancel() {
    this.closeDialog();
  }

  closeDialog() {
    this.modalInstance.dismiss('cancel');
  }
}

LoginDialogController.$inject = ['$scope',
                                 '$rootScope',
                                 '$window',
                                 '$uibModalInstance',
                                 'apiManagerService',
                                 'sessionManagerService',
                                 '$location',
                                 '$log',
                                 'store',
                                 '$auth'
                                ];
