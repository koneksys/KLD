'use strict';

let RDFParser = require('./rdfparser'),
  fs = require('fs'),
  parser = new RDFParser(),
  testFilePath = '/Users/Jaroensawas/Downloads/MathematicsSubjectClassification.rdf',
  rdfxml;

rdfxml = fs.readFileSync(testFilePath).toString();
parser.parseRDFXML(rdfxml, function (result) {
  console.log('result = ', result);
});