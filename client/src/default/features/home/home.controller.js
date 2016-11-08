
export default class HomeController {
  constructor($uibModal,
              $window,
              $timeout,
              $scope,
              $rootScope,
              $sce,
              $state,
              $location,
              $translate,
              $log,
              apiManagerService,
              notificationManagerService,
              sessionManagerService) {
    let self = this;

    this.modal = $uibModal;
    this.window = $window;
    this.timeout = $timeout;
    this.scope = $scope;
    this.r = $rootScope;
    this.profile = this.r.profile;
    this.state = $state;
    this.location = $location;
    this.translate = $translate;
    this.sce = $sce;
    this.log = $log;
    this.tabActive = 0;
    this.currentView = 'dashboard';
    this.widgets = [{
      name: 'Full-Text Search',
      link: 'search',
      description: '...'
    }, {
      name: 'Linking Resources',
      link: 'linking',
      description: '...'
    }, {
      name: 'SPARQL Query',
      link: 'sparql',
      description: '...'
    }, {
      name: 'Import RDF',
      link: 'importfile',
      description: '...'
    }, {
      name: 'Import OSLC',
      link: 'importoslc',
      description: '...'
    }];
    this.headerText = this.window.developerOrg;
    this.clientBuild = this.window.clientBuild;
    this.developerWebsite = this.window.developerWebsite;
    this.developerAddress = this.window.developerAddress;
    this.developerEmail = this.window.developerEmail;
    this.developerPhone = this.window.developerPhone;
    this.product = this.window.product;
    this.developerOrg = this.window.developerOrg;
    this.developerContacts = this.window.developerContacts.split(',');
    this.clickedLogout = false;
    this.apiManagerService = apiManagerService;
    this.sessionManagerService = sessionManagerService;
    this.notifier = notificationManagerService;
    if (!(this.window.clientId && this.window.clientBuild)) {
      this.location.path('readme');
      return;
    }
    this.authorizedApps = [];
    this.authorizedAppsDict = [];
    this.loadAuthorizedApps();
    this.r.$on('openApp', function (event, args) {
      self.openDashboard(self.authorizedAppsDict[args.appName]);
    });
    this.r.$on('reloadProfile', function (event, args) {
      // self.loadAuthorizedApps();
    });
    this.visitorName;
    this.visitorEmail;
    this.visitorSubject;
    this.visitorMessage;
    this.inprogress = false;
    this.tabIconMap = {
      admin: 'cog',
      import: 'cloud-upload',
      searchandedit: 'search',
      types: 'info-sign',
      sparql: 'flash',
      datasets: 'cog',
      dashboard: 'dashboard',
      appstore: 'th',
      contact: 'user'
    };
  }

  submitContactForm() {
    let self = this,
      senderName = this.product,
      senderEmail = this.developerEmail,
      recieptEmail = this.developerEmail,
      subject = this.product + ' [Contact Form] ' + this.visitorName + ' - ' + this.visitorSubject,
      contentPlainText = this.visitorSubject + ' ' + this.visitorMessage,
      contentHTML = '<p>Date: ' + new Date() + '</p>' +
        '<p>Subject: ' + this.visitorSubject + '</p>' +
        '<p>' + this.visitorMessage + '</p>' +
        '<p>Sent from ' + this.visitorName + ', ' + this.visitorEmail + ' </p>',
      autoreplySenderName = this.product,
      autoreplySenderEmail = this.developerEmail,
      autoreplyRecieptEmail = this.visitorEmail,
      autoreplySubject = this.product,
      autoreplyContentPlainText = 'Thank you for your message, We will reply your message soon',
      autoreplyContentHTML = '<p>Thank you for your message</p>' +
        '<p>Date: ' + new Date() + '</p>' +
        '<p>Subject: ' + this.visitorSubject + '</p>' +
        '<p>' + this.visitorMessage + '</p>' +
        '<p>Sent from ' + this.visitorName + ', ' + this.visitorEmail + ' </p>' +
        '<p>We will reply your message soon</p>' +
        '<p>Thank you</p>' +
        '<p>' + this.product + ' Team</p>';

    this.inprogress = true;
    this.apiManagerService.userApiGetClientInfo({}, function (clientInfo) {
      if (clientInfo.returnData.success) {
        contentHTML += '<p>IP: ' + clientInfo.returnData.ip + '</p>';
        contentHTML += '<p>CLIENT: ' + JSON.stringify(clientInfo.returnData.headers, null, 2) + '</p>';
      }

      self.apiManagerService.emailPostSend(
        senderName,
        senderEmail,
        recieptEmail,
        subject,
        contentPlainText,
        contentHTML, function (result) {
        if (result.returnData.success) {
          self.notifier.success({message: 'Thank you for your message'});
        } else {
          self.notifier.error({message: 'Contact form cannot be sent'});
        }
        self.inprogress = false;
        self.visitorName = '';
        self.visitorEmail = '';
        self.visitorSubject = '';
        self.visitorMessage = '';
      });

      self.apiManagerService.emailPostSend(
        autoreplySenderName,
        autoreplySenderEmail,
        autoreplyRecieptEmail,
        autoreplySubject,
        autoreplyContentPlainText,
        autoreplyContentHTML, function (result) {
      });
    });
  }

  loadAuthorizedApps() {
    let self = this,
      authorizations = this.sessionManagerService.get('profile').authorizations,
      apps = Object.keys(authorizations);

    this.authorizedApps = [];
    this.authorizedAppsDict = [];
    apps.forEach(function (appName, index) {
      if (authorizations[appName] && appName !== 'dashboard') {
        self.authorizedApps.push({name: appName});
      }
    });
    this.authorizedApps.forEach(function (appName, index) {
      self.authorizedAppsDict[appName.name] = index;
    });
  }

  reload() {
    let self = this;

    this.apiManagerService.userApiPostLoad(function (response) {
      self.sessionManagerService.set('profile', response.returnData.profile);
      console.log('reload()');
    });
  }

  openDashboard(index) {
    this.tabActive = index;
  }

  adminApiGetPing() {
    let self = this, queryVars = {};

    this.apiManagerService.adminApiGetPing(queryVars, function (response) {
      self.notifier.success({message: JSON.stringify(response)});
    });
  }

  availabilityApiGetPing() {
    let self = this, queryVars = {};

    this.apiManagerService.availabilityApiGetPing(queryVars, function (response) {
      self.notifier.success({message: JSON.stringify(response)});
    });
  }

  fusekiApiGetFusekiMapping() {
    let self = this, queryVars = {};

    this.apiManagerService.fusekiApiGetFusekiMapping(queryVars, function (response) {
      self.notifier.success({message: JSON.stringify(response)});
    });
  }

  userApiGetPing() {
    let self = this, queryVars = {};

    this.apiManagerService.userApiGetPing(queryVars, function (response) {
      self.notifier.success({message: JSON.stringify(response)});
    });
  }

  removeStorage() {
    this.sessionManagerService.remove('profile');
    this.sessionManagerService.remove('token');
    this.sessionManagerService.remove('org');
  }

  clickLogout() {
    this.clickedLogout = true;
    this.removeStorage();
    this.window.location = '/';
  }

  lang(key) {
    this.translate.use(key);
  }

  logout() {
    this.clickLogout();
  }

}

HomeController.$inject = ['$uibModal',
                          '$window',
                          '$timeout',
                          '$scope',
                          '$rootScope',
                          '$sce',
                          '$state',
                          '$location',
                          '$translate',
                          '$log',
                          'apiManagerService',
                          'notificationManagerService',
                          'sessionManagerService'
                         ];
