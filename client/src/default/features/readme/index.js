import './readme.css';

import angular from 'angular';

import routing from './readme.routes';
import ReadmeController from './readme.controller';

export default angular.module('readme', [])
  .config(routing)
  .controller('ReadmeController', ReadmeController)
  .name;
