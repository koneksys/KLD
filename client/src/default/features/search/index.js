import './search.css';

import angular from 'angular';
import 'angular-filter';
import 'angular-ui-utils/modules/utils.js';
import 'angular-ui-utils/modules/event/event.js';
import 'angular-ui-utils/modules/format/format.js';
import 'angular-ui-utils/modules/highlight/highlight.js';
import 'angular-ui-utils/modules/include/include.js';
import 'angular-ui-utils/modules/indeterminate/indeterminate.js';
import 'angular-ui-utils/modules/inflector/inflector.js';
import 'angular-ui-utils/modules/jq/jq.js';
import 'angular-ui-utils/modules/keypress/keypress.js';
import 'angular-ui-utils/modules/mask/mask.js';
import 'angular-ui-utils/modules/reset/reset.js';
import 'angular-ui-utils/modules/route/route.js';
import 'angular-ui-utils/modules/scrollfix/scrollfix.js';
import 'angular-ui-utils/modules/scroll/scroll.js';
import 'angular-ui-utils/modules/scroll/scroll-jqlite.js';
import 'angular-ui-utils/modules/showhide/showhide.js';
import 'angular-ui-utils/modules/unique/unique.js';
import 'angular-ui-utils/modules/validate/validate.js';

import routing from './search.routes';
import SearchController from './search.controller';
import apiManagerService from '../../../services/apiManager.service';
import notificationManagerService from '../../../services/notificationManager.service';
import sessionManagerService from '../../../services/sessionManager.service';

export default angular.module('search',
      ['angular.filter',
       'ui.utils',
        apiManagerService,
        notificationManagerService,
        sessionManagerService
      ])
  .config(routing)
  .controller('SearchController', SearchController)
  .name;

