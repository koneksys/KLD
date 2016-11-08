
export default function routes($stateProvider) {
  $stateProvider
    .state('importfile', {
      url: '/importfile',
      template: require('./import.file.html'),
      controller: 'ImportFileController',
      controllerAs: 'importFile'
    });
}

routes.$inject = ['$stateProvider'];
