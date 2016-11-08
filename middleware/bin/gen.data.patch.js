"use strict";

let fs = require('fs'),
  Generator = require('../lib/generator'),
  gen = new Generator(),
  args = process.argv.slice(2),
  graphName,
  format,
  outputDir,
  inputFilePath,
  outputFilePath;

if (args.length < 3) {
  console.log('usage: node gen.data.patch.js <Graph name> <RDFXML file> <option: format:mode> <option: output dir>');
  console.log('example: node gen.data.patch.js MyGraph ./mydata.rdf ');
  console.log('example: node gen.data.patch.js MyGraph ./mydata.rdf json');
  console.log('example: node gen.data.patch.js MyGraph ./mydata.rdf ttl');
  console.log('example: node gen.data.patch.js MyGraph ./mydata.rdf ./generatePatches');
  process.exit();
} else {
  graphName = args[0];
  inputFilePath = args[1];
  format = args[2];
  outputDir = args[3];
  gen.generateDataPatch(graphName, inputFilePath, format, outputDir);
}
