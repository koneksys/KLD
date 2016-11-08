'use strict'

let fs = require('fs'),
  testFileName = 'test2.csv',
  testFilePath = './' + testFileName,
  testFileData = fs.readFileSync(testFilePath).toString(),
  CsvService = require('./csv.service'),
  csvServiceInstance = new CsvService();
  
csvServiceInstance.buildCSVObject(testFileData, function (csvObject) {

  let identifierBaseUri = 'http://myresourceuri.com',
    publisher = 'http://myresourceuri.com',
    license = 'Common Creative';

  csvServiceInstance.buildRdfXML(
    identifierBaseUri,
    publisher,
    license,
    testFileName,
    csvObject.csvHeaders,
    csvObject.csvHeaderMap,
    csvObject.csvRows,
    function(rdfXML) {
        console.log(rdfXML);
    }
  );

});

