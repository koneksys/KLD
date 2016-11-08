"use strict";

let fs = require('fs'),
  Generator = require('../lib/generator'),
  gen = new Generator(),
  args = process.argv.slice(2),
  graphName,
  outputDir,
  rdfDir,
  outputFilePath;

if (args.length < 2) {
  console.log('usage: node gen.conf.patch.from.dir.js <Graph name> <rdf file directory > <option: output dir>');
  console.log('example: node gen.conf.patch.from.dir.js MyGraph ./myrdf ');
  console.log('example: node gen.conf.patch.from.dir.js MyGraph ./myrdf ./generatePatches');
  process.exit();
} else {
  graphName = args[0];
  rdfDir = args[1];
  outputDir = args[2];
  gen.generateConfPatchFromDir(graphName, rdfDir, outputDir, function (result) {
    console.log(result);
  });
}
