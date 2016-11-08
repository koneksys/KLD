import './import.oslc.css';

import angular from 'angular';

import routing from './import.oslc.routes';
import ImportOSLCController from './import.oslc.controller';
import apiManagerService from '../../../services/apiManager.service';
import notificationManagerService from '../../../services/notificationManager.service';

export default angular.module('import.oslc',
      [apiManagerService,
       notificationManagerService
      ])
  .config(routing)
  .controller('ImportOSLCController', ImportOSLCController)
  .name;

