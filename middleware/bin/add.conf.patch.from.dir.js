"use strict";

let fs = require('fs'),
  Generator = require('../lib/generator'),
  gen = new Generator(),
  args = process.argv.slice(2),
  provisioningFilePath,
  patchDir;

if (args.length < 2) {
  console.log('usage: node add.conf.patch.from.dir.js <provisioning> <patch directory >');
  console.log('example: node add.conf.patch.from.dir.js /provisioning.json ./mypatch ');
  process.exit();
} else {
  provisioningFilePath = args[0];
  patchDir = args[1];
  gen.addConfPatchFromDir(provisioningFilePath, patchDir);
}
