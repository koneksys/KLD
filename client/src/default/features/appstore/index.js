import './appstore.css';

import angular from 'angular';

import routing from './appstore.routes';
import AppStoreController from './appstore.controller';
import apiManagerService from '../../../services/apiManager.service';
import notificationManagerService from '../../../services/notificationManager.service';
import sessionManagerService from '../../../services/sessionManager.service';

export default angular.module('appstore',
      [apiManagerService,
       notificationManagerService,
       sessionManagerService
      ])
  .config(routing)
  .controller('AppStoreController', AppStoreController)
  .name;

