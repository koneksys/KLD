import angular from 'angular';
import routing from './import.routes';

import ImportController from './import.controller';

export default angular.module('import', [])
  .config(routing)
  .controller('ImportController', ImportController)
  .name;
