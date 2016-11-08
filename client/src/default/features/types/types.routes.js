
export default function routes($stateProvider) {
  $stateProvider
    .state('types', {
      url: '/types',
      template: require('./types.html'),
      controller: 'TypesController',
      controllerAs: 'types'
    });
}

routes.$inject = ['$stateProvider'];
