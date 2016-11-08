
export default function routes($stateProvider) {
  $stateProvider
    .state('importoslc', {
      url: '/importoslc',
      template: require('./import.oslc.html'),
      controller: 'ImportOSLCController',
      controllerAs: 'oslc'
    });
}

routes.$inject = ['$stateProvider'];
