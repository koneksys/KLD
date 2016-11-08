
export default class ViewRdfDialogController {

  constructor($scope, data, $uibModalInstance, apiManagerService) {
    let self = this;

    this.apiManagerService = apiManagerService;
    this.modalInstance = $uibModalInstance;
    this.scope = $scope;
    this.title = data.title;
    this.rdf = data.rdf;
    this.scope.$on('closeModalDialog', function (event, args) {
      self.modalInstance.dismiss('cancel');
    });
  }

  close() {
    this.closeDialog();
  }

  closeDialog() {
    this.modalInstance.dismiss('cancel');
  }
}

ViewRdfDialogController.$inject = ['$scope',
                                  'data',
                                 '$uibModalInstance',
                                 'apiManagerService'
                                ];
