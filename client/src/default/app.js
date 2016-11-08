import angular from 'angular';
require('./app.frameworks');

require('bootstrap-webpack!./bootstrap.config.js');
import './base.css';
import './app.script';
import conf from './app.json';
import appEnv from './app.env.js';
import login from './features/login';
import readme from './features/readme';
import home from './features/home';
import dashboard from './features/dashboard';
import appstore from './features/appstore';
import linking from './features/linking';
import dataset from './features/dataset';
import searchAndEdit from './features/search.and.edit';
import search from './features/search';
import sparql from './features/sparql';
import importTab from './features/import';
import importFile from './features/import.file';
import importOslc from './features/import.oslc';
import types from './features/types';
import admin from './features/admin';
import typesVisualizerDirective from '../directives/types.visualizer.directive';

angular.module('app', [ 'app.frameworks',
                        login,
                        readme,
                        home,
                        dashboard,
                        appstore,
                        dataset,
                        searchAndEdit,
                        search,
                        linking,
                        sparql,
                        importTab,
                        importFile,
                        importOslc,
                        types,
                        admin,
                        typesVisualizerDirective
                      ])
    .config(['$translateProvider', '$translateSanitizationProvider',
      function ($translateProvider, $translateSanitizationProvider) {
        $translateProvider.translations('en', conf.langs.en);
        $translateProvider.translations('de', conf.langs.de);
        $translateProvider.translations('fr', conf.langs.fr);
        $translateProvider.translations('th', conf.langs.th);
        $translateProvider.preferredLanguage('en');
        $translateSanitizationProvider.addStrategy('sce', 'sceStrategy');
        $translateProvider.useSanitizeValueStrategy('sce');
      }])
    .config(['$compileProvider', function ($compileProvider) {
      $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|local|data|file|tel|mailto|chrome-extension):/);
    }])
    .config(['$authProvider', function ($authProvider) {
      $authProvider.google({
        clientId: 'Google Client ID',
        url: '/auth/google',
        authorizationEndpoint: 'https://accounts.google.com/o/oauth2/auth',
        redirectUri: window.location.origin,
        requiredUrlParams: ['scope'],
        optionalUrlParams: ['display'],
        scope: ['profile', 'email'],
        scopePrefix: 'openid',
        scopeDelimiter: ' ',
        display: 'popup',
        type: '2.0',
        popupOptions: { width: 452, height: 633 }
      });
    }])
    .run(['$rootScope', 'store', 'jwtHelper', '$location',
      function ($rootScope, store, jwtHelper, $location, apiManagerService) {
        window.clientId = appEnv.clientId;
        window.clientBuild = appEnv.clientBuild;
        window.developerOrg = appEnv.developerOrg;
        window.product = appEnv.product;
        window.developerWebsite = appEnv.developerWebsite;
        window.developerContacts = appEnv.developerContacts;
        window.developerAddress = appEnv.developerAddress;
        window.developerEmail = appEnv.developerEmail;
        window.developerPhone = appEnv.developerPhone;

        if (window.clientId === undefined ||
            window.clientBuild === undefined ||
            window.developerOrg === undefined ||
            window.product === undefined ||
            window.developerWebsite === undefined ||
            window.developerContacts === undefined ||
            window.developerAddress === undefined ||
            window.developerEmail === undefined ||
            window.developerPhone === undefined) {
          $location.path('/readme');
        } else {
          $rootScope.$on('$locationChangeStart', function (event) {
            let token = store.get('token');

            if (token) {
              if (!jwtHelper.isTokenExpired(token)) {
              } else {
                $location.path('/login');
              }
            } else {
              $location.path('/login');
            }
          });
        }
      }]);
