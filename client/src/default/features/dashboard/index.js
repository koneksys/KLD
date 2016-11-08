import './dashboard.css';

import angular from 'angular';

import routing from './dashboard.routes';
import DashboardController from './dashboard.controller';
import apiManagerService from '../../../services/apiManager.service';
import notificationManagerService from '../../../services/notificationManager.service';
import sessionManagerService from '../../../services/sessionManager.service';

export default angular.module('dashboard',
      [apiManagerService,
       notificationManagerService,
       sessionManagerService
      ])
  .config(routing)
  .controller('DashboardController', DashboardController)
  .name;

