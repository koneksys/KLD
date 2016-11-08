"use strict";

let fs = require('fs'),
  Generator = require('../lib/generator'),
  gen = new Generator(),
  args = process.argv.slice(2),
  provisioningFilePath,
  provisioningFileContent;

if (args.length !== 1) {
  console.log('usage: node delete.solr.cores.js <provisioning>');
  console.log('example: node delete.solr.cores.js  ./provisioning.json');
  process.exit();
} else {
  provisioningFilePath = args[0];
  gen.deleteSolrCores(provisioningFilePath);
}

