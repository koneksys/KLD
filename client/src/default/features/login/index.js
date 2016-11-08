import './login.css';

import angular from 'angular';

import routing from './login.routes';
import LoginController from './login.controller';
import apiManagerService from '../../../services/apiManager.service';
import sessionManagerService from '../../../services/sessionManager.service';

export default angular.module('login', [apiManagerService, sessionManagerService])
  .config(routing)
  .controller('LoginController', LoginController)
  .name;
