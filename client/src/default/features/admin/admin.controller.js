
export default class AdminController {

  constructor($uibModal, apiManagerService, notificationManagerService, $rootScope, $scope, $window, $timeout, store) {
    let self = this;

    this.modal = $uibModal;
    this.apiManagerService = apiManagerService;
    this.notifier = notificationManagerService;
    this.r = $rootScope;
    this.scope = $scope;
    this.window = $window;
    this.timeout = $timeout;
    this.store = store;
    this.provisioningName = this.window.clientId;
    this.inprogress = false;
    this.alerts = [];
    this.scope.$on('initiateProvisioning', function (event, args) {
      self.emptyOrgData(false, false);
    });
  }

  broadcast() {
    this.r.$broadcast('refreshUI', {});
  }

  sendEmail() {
    let self = this,
      senderName = 'Admin',
      senderEmail = 'vorachet@gmail.com',
      recieptEmail = 'vorachet@icloud.com',
      subject = 'test ทดสอบ',
      contentPlainText = 'ภาษาไทย English',
      contentHTML = '<font color="red">ภาษาไทย English</font>';

    this.inprogress = true;
    this.apiManagerService.emailPostSend(senderName, senderEmail, recieptEmail,
      subject, contentPlainText, contentHTML, function (result) {
      console.log('result = ', result);
      if (result.returnData.success) {
        self.addAlert('success', new Date() + ': ' + result.returnData.message);
        self.notifier.success({message: result.returnData.message});
      } else {
        self.addAlert('danger', new Date() + ': ' + result.returnData.message);
        self.notifier.error({message: result.returnData.message});
      }
      self.inprogress = false;
    });
  }

  clearAlerts() {
    this.alerts = [];
  }

  addAlert(type, message) {
    this.alerts.push({type: type, msg: message});
  }

  closeAlert(index) {
    this.alerts.splice(index, 1);
  }

  broadcast() {
    this.r.$broadcast('refreshUI', {});
  }

  emptyOrgData(askUserBeforeAction, deleteUserDataset) {
    let self = this, yes;

    if (askUserBeforeAction) {
      yes = confirm('Do you want to delete data on this server?');
      if (yes !== true) {
        return;
      }
    }

    this.deleteProvisioningDatabase(function (s1) {
      if (s1) {
        if (deleteUserDataset) {
          self.deleteProvisioning(function (s2) {
            if (s2) {
              self.addProvisioning(function (s3) {
                if (s3) {
                  self.stopDatastore(function (s4) {
                    if (s4) {
                      self.startDatastore(function (s5) {
                        if (s5) {
                          self.broadcast();
                          self.notifier.success({message: 'Data on this server has been deleted'});
                        }
                      });
                    }
                  });
                }
              });
            }
          });
        } else {
          self.deleteProvisioningWithoutCleanupUserDataset(function (s2) {
            if (s2) {
              self.addProvisioning(function (s3) {
                if (s3) {
                  self.stopDatastore(function (s4) {
                    if (s4) {
                      self.startDatastore(function (s5) {
                        if (s5) {
                          self.broadcast();
                          self.notifier.success({message: 'Data on this server has been deleted'});
                        }
                      });
                    }
                  });
                }
              });
            }
          });
        }
      }
    });
  }

  deleteProvisioningDatabase(callback) {
    let self = this;

    this.inprogress = true;
    this.apiManagerService.provisioningApiDeleteDatabase(function (result) {
      console.log('result = ', result);
      if (result.returnData.success) {
        self.addAlert('success', new Date() + ': ' + result.returnData.message);
        self.notifier.success({message: result.returnData.message});
        if (callback) { callback(true); }
      } else {
        self.addAlert('danger', new Date() + ': ' + result.returnData.message);
        self.notifier.error({message: result.returnData.message});
        if (callback) { callback(false); }
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
        self.broadcast();
        self.addAlert('success', new Date() + ': ' + result.returnData.message);
        if (!callback) self.notifier.success({message: result.returnData.message});
        if (callback) { callback(true); }
      } else {
        self.addAlert('danger', new Date() + ': ' + result.returnData.message);
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
        self.addAlert('success', new Date() + ': ' + result.returnData.message);
        if (!callback) self.notifier.success({message: result.returnData.message});
        if (callback) { callback(true); }
      } else {
        self.addAlert('danger', new Date() + ': ' + result.returnData.message);
        if (!callback) self.notifier.error({message: result.returnData.message});
        if (callback) { callback(false); }
      }
      self.inprogress = false;
    });
  }

  addProvisioning(callback) {
    let self = this;

    this.inprogress = true;
    this.apiManagerService.provisioningApiAddProvisioning(function (result) {
      console.log('result = ', result);
      if (result.returnData.success) {
        self.addAlert('success', new Date() + ': ' + result.returnData.message);
        self.notifier.success({message: result.returnData.message});
        if (callback) { callback(true); }
      } else {
        self.addAlert('danger', new Date() + ': ' + result.returnData.message);
        self.notifier.error({message: result.returnData.message});
        if (callback) { callback(false); }
      }
      self.inprogress = false;
    });
  }

  deleteProvisioning(callback) {
    let self = this;

    this.inprogress = true;
    this.apiManagerService.provisioningApiDeleteProvisioning(function (result) {
      if (result.returnData.success) {
        self.addAlert('success', new Date() + ': ' + result.returnData.message);
        self.notifier.success({message: result.returnData.message});
        if (callback) { callback(true); }
      } else {
        self.addAlert('danger', new Date() + ': ' + result.returnData.message);
        self.notifier.error({message: result.returnData.message});
        if (callback) { callback(false); }
      }
      self.inprogress = false;
    });
  }

  deleteProvisioningWithoutCleanupUserDataset(callback) {
    let self = this;

    this.inprogress = true;
    this.apiManagerService.provisioningApiDeleteProvisioningWithoutCleanupUserDataset(function (result) {
      if (result.returnData.success) {
        self.addAlert('success', new Date() + ': ' + result.returnData.message);
        self.notifier.success({message: result.returnData.message});
        if (callback) { callback(true); }
      } else {
        self.addAlert('danger', new Date() + ': ' + result.returnData.message);
        self.notifier.error({message: result.returnData.message});
        if (callback) { callback(false); }
      }
      self.inprogress = false;
    });
  }

}

AdminController.$inject = ['$uibModal',
                                'apiManagerService',
                                'notificationManagerService',
                                '$rootScope',
                                '$scope',
                                '$window',
                                '$timeout',
                                'store'
                                ];
