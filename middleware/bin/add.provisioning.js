"use strict";

let fs = require('fs'),
  args = process.argv.slice(2),
  Generator = require('../lib/generator'),
  gen = new Generator(),
  provisioningFilePath;

if (args.length !== 1) {
  console.log('usage: node add.provisioning.js <provisioning>');
  console.log('example: node add.provisioning.js  ./provisioning.json');
  process.exit();
} else {
  provisioningFilePath = args[0];
  gen.addProvisioning(provisioningFilePath);
}
