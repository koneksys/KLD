import angular from 'angular';

import SearchAndEditController from './se.controller';

export default angular.module('search.and.edit', [])
  .controller('SearchAndEditController', SearchAndEditController)
  .name;
