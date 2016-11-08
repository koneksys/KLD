
import 'jquery-ui/themes/base/jquery.ui.all.css';
import './linking.css';

import angular from 'angular';
import routing from './linking.routes';
import LinkingController from './linking.controller';
import apiManagerService from '../../../services/apiManager.service';
import notificationManagerService from '../../../services/notificationManager.service';

export default angular.module('linking', [apiManagerService, notificationManagerService])
  .config(routing)
  .controller('LinkingController', LinkingController)
  .name;

