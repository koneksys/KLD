"use strict";

let fs = require('fs'),
  args = process.argv.slice(2),
  Generator = require('../lib/generator'),
  gen = new Generator(),
  provisioningFilePath,
  patchFilePath;

if (args.length !== 2) {
  console.log('usage: node add.conf.patch.js  <provisioning>  <patch>');
  console.log('example: node add.conf.patch.js   ./provisioning.json   ./patch.json');
  process.exit();
} else {
  provisioningFilePath = args[0];
  patchFilePath = args[1];
  gen.addConfPatch(provisioningFilePath, patchFilePath);
}
