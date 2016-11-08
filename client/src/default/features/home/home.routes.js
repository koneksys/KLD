
export default function routes($stateProvider) {
  $stateProvider
    .state('home', {
      url: '/',
      views: {
        '': {
          template: require('./home.html'),
          controller: 'HomeController',
          controllerAs: 'home'
        },
        'dashboard@home': {
          template: require('../dashboard/dashboard.html'),
          controller: 'DashboardController',
          controllerAs: 'dashboard'
        },
        'datasets@home': {
          template: require('../dataset/dataset.html'),
          controller: 'DatasetController',
          controllerAs: 'datasets'
        },
        'fulltextsearch@home': {
          template: require('../search/search.html'),
          controller: 'SearchController',
          controllerAs: 'search'
        },
        'searchandedit@home': {
          template: require('../search.and.edit/se.html'),
          controller: 'SearchAndEditController',
          controllerAs: 'se'
        },
        'linking@home': {
          template: require('../linking/linking.html'),
          controller: 'LinkingController',
          controllerAs: 'linking'
        },
        'sparql@home': {
          template: require('../sparql/sparql.html'),
          controller: 'SparqlController',
          controllerAs: 'sparql'
        },
        'import@home': {
          template: require('../import/import.html'),
          controller: 'ImportController',
          controllerAs: 'import'
        },
        'importfile@home': {
          template: require('../import.file/import.file.html'),
          controller: 'ImportFileController',
          controllerAs: 'importFile'
        },
        'importoslc@home': {
          template: require('../import.oslc/import.oslc.html'),
          controller: 'ImportOSLCController',
          controllerAs: 'oslc'
        },
        'types@home': {
          template: require('../types/types.html'),
          controller: 'TypesController',
          controllerAs: 'types'
        },
        'appstore@home': {
          template: require('../appstore/appstore.html'),
          controller: 'AppStoreController',
          controllerAs: 'appstore'
        },
        'admin@home': {
          template: require('../admin/admin.html'),
          controller: 'AdminController',
          controllerAs: 'admin'
        }
      }
    });
}

routes.$inject = ['$stateProvider'];
