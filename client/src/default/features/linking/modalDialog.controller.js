
export default class ModalDialogController {

  constructor($scope, $uibModalInstance, content) {
    let self = this;

    this.modalInstance = $uibModalInstance;
    this.scope = $scope;
    this.title = content.title;
    this.body = content.body;
    this.showOK = content.showOK;
    this.showYES = content.showYES;
    this.showNO = content.showNO;
    this.showCANCEL = content.showCANCEL;
    this.showCLOSE = content.showCLOSE;
    this.scope.$on('closeModalDialog', function (event, args) {
      self.modalInstance.dismiss('cancel');
    });
  }

  ok(callback) {
    this.modalInstance.dismiss('cancel');
    if (callback !== undefined) { callback('ok'); }
  }

  yes(callback) {
    this.modalInstance.dismiss('cancel');
    if (callback !== undefined) { callback('yes'); }
  }

  no(callback) {
    this.modalInstance.dismiss('cancel');
    if (callback !== undefined) { callback('no'); }
  }

  cancel(callback) {
    this.modalInstance.dismiss('cancel');
    if (callback !== undefined) { callback('cancel'); }
  }
}

ModalDialogController.$inject = ['$scope',
                                 '$uibModalInstance',
                                 'content',
                                 'callback'
                                ];
