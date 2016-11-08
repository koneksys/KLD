
export default function routes($stateProvider) {
  $stateProvider
    .state('fulltextsearch', {
      url: '/fulltextsearch',
      template: require('./search.html'),
      controller: 'SearchController',
      controllerAs: 'search'
    });
}

routes.$inject = ['$stateProvider'];
