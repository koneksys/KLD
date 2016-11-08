
import './home.css';

import angular from 'angular';
import routing from './home.routes';
import HomeController from './home.controller';
import apiManagerService from '../../../services/apiManager.service';
import notificationManagerService from '../../../services/notificationManager.service';
import sessionManagerService from '../../../services/sessionManager.service';

export default angular.module('home', [apiManagerService, notificationManagerService, sessionManagerService])
  .config(routing)
  .controller('HomeController', HomeController)
  .name;

