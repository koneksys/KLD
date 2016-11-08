"use strict";

let fs = require('fs'),
  Generator = require('../lib/generator'),
  gen = new Generator(),
  Runner = require('../lib/runner'),
  runner = new Runner(),
  args = process.argv.slice(2),
  mode,
  provisioningFilePath,
  provisioningFileContent;

if (args.length < 1) {
  usage();
  process.exit();
} else {
  mode = args[0];
  provisioningFilePath = args[1];
  if (mode === 'start') {
    runner.startSOLR(provisioningFilePath);
  } else if (mode === 'stop') {
    runner.stopSOLR();
  } else if (mode === 'restart') {
    runner.restartSOLR(provisioningFilePath);
  } else {
    usage();
    process.exit();
  }
}

function usage() {
  console.log('usage: node solr.server.js start <provisioning>');
  console.log('usage: node solr.server.js stop ');
  console.log('usage: node solr.server.js restart <provisioning>');
  console.log('example: node solr.server.js start ./provisioning.json');
  console.log('example: node solr.server.js stop');
  console.log('example: node solr.server.js restart ./provisioning.json');
}
