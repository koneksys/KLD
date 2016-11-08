import angular from 'angular';

class ErrorManager {
  constructor() {
  }

  addErrorEvent(where, what) {
    console.error('where', where);
    console.error('what', what);
  }
}

export default angular.module('services.error-manager', [])
  .service('errorManagerService', ErrorManager)
  .name;
