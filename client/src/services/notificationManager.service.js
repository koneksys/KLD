import angular from 'angular';
import 'angular-ui-notification/dist/angular-ui-notification.min.css';
import 'angular-ui-notification';

class NotificationManager {
  constructor(Notification) {
    this.notification = Notification;
    this.conf = {positionY: 'bottom', positionX: 'left'};
  }

  primary(params) {
    this.conf.title = params.title;
    this.conf.message = params.message;
    this.notification.primary(this.conf);
  }

  success(params) {
    this.conf.title = params.title;
    this.conf.message = params.message;
    this.notification.success(this.conf);
  }

  warning(params) {
    this.conf.title = params.title;
    this.conf.message = params.message;
    this.notification.warning(this.conf);
  }

  error(params) {
    this.conf.title = params.title;
    this.conf.message = params.message;
    this.notification.error(this.conf);
  }
}

NotificationManager.$inject = ['Notification'];

export default angular.module('services.notification-manager', ['ui-notification'])
  .service('notificationManagerService', NotificationManager)
  .name;
