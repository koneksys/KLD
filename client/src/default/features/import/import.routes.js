
export default function routes($stateProvider) {
  $stateProvider
    .state('import', {
      url: '/import',
      template: require('./import.html'),
      controller: 'ImportController',
      controllerAs: 'import'
    });
}

routes.$inject = ['$stateProvider'];
