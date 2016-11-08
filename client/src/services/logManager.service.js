import angular from 'angular';

class LogManager {
  constructor() {
  }
}

export default angular.module('services.log-manager', [])
  .service('logManagerService', LogManager)
  .name;
