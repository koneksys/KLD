import './types.css';

import angular from 'angular';

import routing from './types.routes';
import TypesController from './types.controller';
import apiManagerService from '../../../services/apiManager.service';
import notificationManagerService from '../../../services/notificationManager.service';

export default angular.module('types',
      [apiManagerService,
       notificationManagerService
      ])
  .config(routing)
  .controller('TypesController', TypesController)
  .name;

