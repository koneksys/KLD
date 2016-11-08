import './dataset.css';

import angular from 'angular';
import routing from './dataset.routes';
import DatasetController from './dataset.controller';
import apiManagerService from '../../../services/apiManager.service';
import notificationManagerService from '../../../services/notificationManager.service';
import sessionManagerService from '../../../services/sessionManager.service';

export default angular.module('dataset', [apiManagerService, notificationManagerService, sessionManagerService])
  .config(routing)
  .controller('DatasetController', DatasetController)
  .name;

