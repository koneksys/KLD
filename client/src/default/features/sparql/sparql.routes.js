
export default function routes($stateProvider) {
  $stateProvider
    .state('sparql', {
      url: '/sparql',
      template: require('./sparql.html'),
      controller: 'SparqlController',
      controllerAs: 'sparql'
    });
}

routes.$inject = ['$stateProvider'];
