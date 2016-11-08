require('jquery');
require('angular-ui-bootstrap/dist/ui-bootstrap-tpls.js');

import angular from 'angular';
import uirouter from 'angular-ui-router';
import ngRoute from 'angular-route';
import angularStorage from 'angular-storage';
import angularJwt from 'angular-jwt';
import ngSanitize from 'angular-sanitize';
import ngAnimate from 'angular-animate';
import 'angular-ui-grid/ui-grid.js';
import 'angular-ui-grid/ui-grid.css';
import ngTranslate from 'angular-translate';
import ngTouch from 'angular-touch';
import ngCookies from 'angular-cookies';
import 'angular-busy/dist/angular-busy.js';
import 'angular-busy/dist/angular-busy.css';
import routing from './app.routes';
import ngSatellizer from 'satellizer';

angular.module('app.frameworks', [ uirouter,
                        ngRoute,
                        ngTouch,
                        angularStorage,
                        angularJwt,
                        'ui.bootstrap',
                        ngTranslate,
                        'ui.grid',
                        'ui.grid.pagination',
                        'ui.grid.autoResize',
                        'ui.grid.treeView',
                        'ui.grid.infiniteScroll',
                        'ui.grid.edit',
                        ngAnimate,
                        ngSanitize,
                        ngCookies,
                        'cgBusy',
                        ngSatellizer
                      ])
    .config(routing)
    .config(['$compileProvider', function ($compileProvider) {
      $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|local|data|file|tel|mailto|chrome-extension):/);
    }])
    .factory('sceStrategy', ['$sce', function ($sce) {
      return function (value, mode) {
        var result = '';

        if (mode === 'text') {
          result = $sce.trustAsHtml(value);
          if (result.$unwrapTrustedValue) {
            result = result.$unwrapTrustedValue();
          }
          value = result;
        }
        return value;
      };
    }])
    .controller('AppCtrl', ['$scope', '$location', function AppCtrl($scope, $location) {
      $scope.title = window.product;
      $scope.$on('$routeChangeSuccess', function (e, nextRoute) {
        if (nextRoute.$$route && angular.isDefined(nextRoute.$$route.pageTitle)) {
          $scope.pageTitle = nextRoute.$$route.pageTitle;
        }
      });
    }]);
