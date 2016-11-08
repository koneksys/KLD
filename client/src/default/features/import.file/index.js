import './import.file.css';

import angular from 'angular';
import 'angular-file-upload/dist/angular-file-upload.js';

import routing from './import.file.routes';
import ImportFileController from './import.file.controller';
import apiManagerService from '../../../services/apiManager.service';
import notificationManagerService from '../../../services/notificationManager.service';
import sessionManagerService from '../../../services/sessionManager.service';

export default angular.module('import.file',
      [apiManagerService,
       notificationManagerService,
       sessionManagerService,
       'angularFileUpload'
      ])
  .config(routing)
  .controller('ImportFileController', ImportFileController)
  .name;

