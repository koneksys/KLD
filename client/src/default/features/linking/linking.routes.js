
export default function routes($stateProvider) {
  $stateProvider
    .state('linking', {
      url: '/linking',
      template: require('./linking.html'),
      controller: 'LinkingController',
      controllerAs: 'linking'
    });
}

routes.$inject = ['$stateProvider'];
