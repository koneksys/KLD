
export default function routes($stateProvider) {
  $stateProvider
    .state('appstore', {
      url: '/appstore',
      template: require('./appstore.html'),
      controller: 'AppStoreController',
      controllerAs: 'appstore'
    });
}

routes.$inject = ['$stateProvider'];
