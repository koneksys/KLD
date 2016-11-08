"use strict";

let fs = require('fs'),
  Generator = require('../lib/generator'),
  gen = new Generator(),
  args = process.argv.slice(2),
  graphName,
  outputDir,
  inputFilePath,
  outputFilePath;

if (args.length < 2) {
  console.log('usage: node gen.conf.patch.js <Graph name> <RDFXML file> <Option: output dir>');
  console.log('example: node gen.conf.patch.js MyGraph ./mydata.rdf ');
  console.log('example: node gen.conf.patch.js MyGraph ./mydata.rdf ./generatePatches');
  process.exit();
} else {
  graphName = args[0];
  inputFilePath = args[1];
  outputDir = args[2];
  gen.generateConfPatch(graphName, inputFilePath, outputDir);
}
