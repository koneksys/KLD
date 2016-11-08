import './admin.css';

import angular from 'angular';

import routing from './admin.routes';
import AdminController from './admin.controller';
import apiManagerService from '../../../services/apiManager.service';
import notificationManagerService from '../../../services/notificationManager.service';

export default angular.module('admin',
      [apiManagerService,
       notificationManagerService
      ])
  .config(routing)
  .controller('AdminController', AdminController)
  .name;

