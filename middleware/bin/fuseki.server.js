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
    runner.startFUSEKI(provisioningFilePath);
  } else if (mode === 'stop') {
    runner.stopFUSEKI();
  } else if (mode === 'restart') {
    runner.restartFUSEKI(provisioningFilePath);
  } else {
    usage();
    process.exit();
  }
}

function usage() {
  console.log('usage: node fuseki.server.js start <provisioning>');
  console.log('usage: node fuseki.server.js stop ');
  console.log('usage: node fuseki.server.js restart <provisioning>');
  console.log('example: node fuseki.server.js start ./provisioning.json');
  console.log('example: node fuseki.server.js stop');
  console.log('example: node fuseki.server.js restart ./provisioning.json');
}
