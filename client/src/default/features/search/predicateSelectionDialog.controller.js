
export default class PredicateSelectionDialogController {

  constructor($scope, content, callback, $uibModalInstance, apiManagerService) {
    let self = this;

    this.apiManagerService = apiManagerService;
    this.modalInstance = $uibModalInstance;
    this.scope = $scope;
    this.content = content;
    this.callback = callback;
    this.scope.$on('closeModalDialog', function (event, args) {
      self.modalInstance.dismiss('cancel');
    });
  }

  select(selectedPredicate, callback) {
    let data = {
      success: true,
      selectedPredicate: selectedPredicate
    };

    this.closeDialog();
    callback(data);
  }

  cancel(callback) {
    let data = {
      success: false,
      selectedPredicate: ''
    };

    this.closeDialog();
    callback(data);
  }

  closeDialog() {
    this.modalInstance.dismiss('cancel');
  }
}

PredicateSelectionDialogController.$inject = ['$scope',
                                              'content',
                                              'callback',
                                              '$uibModalInstance',
                                              'apiManagerService'
                                             ];
