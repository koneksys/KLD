import './sparql.css';

import angular from 'angular';
import routing from './sparql.routes';
import SparqlController from './sparql.controller';
import apiManagerService from '../../../services/apiManager.service';
import notificationManagerService from '../../../services/notificationManager.service';
import sessionManagerService from '../../../services/sessionManager.service';

export default angular.module('sparql', [apiManagerService, notificationManagerService, sessionManagerService])
  .config(routing)
  .config(['$compileProvider', function ($compileProvider) {
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(|blob|):/);
  }])
  .filter('escape', function () {
    return window.encodeURIComponent;
  })
  .controller('SparqlController', SparqlController)
  .name;
