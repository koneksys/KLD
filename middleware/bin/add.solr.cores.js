"use strict";

let fs = require('fs'),
  args = process.argv.slice(2),
  Generator = require('../lib/generator'),
  gen = new Generator(),
  provisioningFilePath;

if (args.length !== 1) {
  console.log('usage: node add.solr.cores.js <provisioning>');
  console.log('example: node add.solr.cores.js  ./provisioning.json');
  process.exit();
} else {
  provisioningFilePath = args[0];
  gen.addSolrCores(provisioningFilePath);
}
