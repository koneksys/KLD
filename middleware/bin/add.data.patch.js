"use strict";

let fs = require('fs'),
  args = process.argv.slice(2),
  Generator = require('../lib/generator'),
  gen = new Generator(),
  provisioningFilePath,
  patchFilePath,
  format;

if (args.length !== 3) {
  console.log('usage: node add.data.patch.js  <provisioning>  <patch> <format>');
  console.log('example: node add.data.patch.js   ./provisioning.json  ./data.patch.json  json');
  console.log('example: node add.data.patch.js   ./provisioning.json  ./data.patch.ttl  ttl');
  process.exit();
} else {
  provisioningFilePath = args[0];
  patchFilePath = args[1];
  format = args[2];
  gen.addDataPatch(provisioningFilePath, patchFilePath, format, function (result) {
    console.log(result);
    process.exit(0);
  });
}
