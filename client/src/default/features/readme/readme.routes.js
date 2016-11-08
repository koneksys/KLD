
export default function routes($stateProvider) {
  $stateProvider
    .state('readme', {
      url: '/readme',
      template: require('./readme.html'),
      controller: 'ReadmeController',
      controllerAs: 'readme'
    });
}

routes.$inject = ['$stateProvider'];
