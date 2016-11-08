
export default function routes($stateProvider) {
  $stateProvider
    .state('datasets', {
      url: '/datasets',
      template: require('./dataset.html'),
      controller: 'DatasetController',
      controllerAs: 'datasets'
    });
}

routes.$inject = ['$stateProvider'];
