'use strict'

let debug = require('debug')('CsvService'),
  querystring = require('querystring'),
  csv = require('csv-parse');

class CsvService {
  constructor() {
    this.csv = csv;
    debug('loaded')
  }

  buildRdfXML(identifierBaseUri, publisher, license, fileName, csvHeaders, csvHeaderMap, csvRows, callback) {
    let self = this,
      rdfxml = '';

    rdfxml += '<?xml version="1.0" encoding="UTF-8"?> \n';
    rdfxml += '<rdf:RDF \n';
    rdfxml += '\txmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" \n';
    rdfxml += '\txmlns:dc="http://purl.org/dc/terms#" \n';
    rdfxml += '\txmlns:sheet="http://example.org/sheet#" \n';
    rdfxml += '\txmlns:column="http://example.org/column#"> \n';
    rdfxml += '\n'; 

    rdfxml += '\t<sheet:file rdf:about="' + identifierBaseUri + '/' + fileName + '"> \n';

    Object.keys(csvHeaderMap).forEach(function (fieldName) {
      if (fieldName !== 'undefined') {
        rdfxml += '\t\t<sheet:column rdf:parseType="Literal">' + self.trimFieldName(fieldName) + '</sheet:column> \n'; 
      }
    });

    csvRows.forEach(function (row, index) {
      rdfxml += '\t\t<sheet:row rdf:resource="' + identifierBaseUri + '/' + fileName + '/row/' + (index + 1) + '/' + 'r' + (index + 1) + '(' + fileName + ')"/> \n'; 
      // rdfxml += '\t\t<dc:hasPart rdf:resource="' + identifierBaseUri + '/' + fileName + '/row/' + (index + 1) + '"/> \n'; 
    });

    rdfxml += '\t\t<sheet:rowCount rdf:parseType="Literal">' + csvRows.length + '</sheet:rowCount> \n'; 
    rdfxml += '\t\t<sheet:created rdf:parseType="Literal">' + new Date() + '</sheet:created> \n'; 
    rdfxml += '\t\t<sheet:modified rdf:parseType="Literal">' + new Date() + '</sheet:modified> \n'; 
    rdfxml += '\t\t<sheet:publisher rdf:parseType="Literal">' + publisher + '</sheet:publisher> \n'; 
    rdfxml += '\t\t<sheet:license rdf:parseType="Literal">' + license + '</sheet:license> \n'; 
    rdfxml += '\t</sheet:file> \n'; 
    rdfxml += '\n'; 

    csvRows.forEach(function (row, index) {
      rdfxml += '\t<sheet:row rdf:about="' + identifierBaseUri + '/' + fileName + '/row/' + 'r' + (index + 1) + '(' + fileName + ')"> \n';
      row.forEach(function (colVal, colIndex) {
        let colVocab = csvHeaderMap[csvHeaders[colIndex]];


        // rdfxml += '\t\t<column:name rdf:parseType="Literal">' + self.trimFieldName(colVocab) + '</column:name> \n';

        if (self.startWithProtocol(colVal)) {
           rdfxml += '\t\t<column:' + self.trimFieldName(colVocab) + ' rdf:parseType="Literal">' + self.validUrl(colVal).trim() + '</column:' + self.trimFieldName(colVocab) + '> \n';
        } else {
           rdfxml += '\t\t<column:' + self.trimFieldName(colVocab) + ' rdf:parseType="Literal">' + self.validText(colVal).trim() + '</column:' + self.trimFieldName(colVocab) + '> \n';
        }
      });
      rdfxml += '\t\t<sheet:isPartOf rdf:resource="' + identifierBaseUri + '/' + fileName + '"/> \n';
      rdfxml += '\t</sheet:row> \n'; 
      rdfxml += '\n'; 
    });

    csvRows.forEach(function (row, index) {
      row.forEach(function (colVal, colIndex) {
        let colVocab = csvHeaderMap[csvHeaders[colIndex]];
        let colName = self.trimFieldName(colVocab);

        rdfxml += '\t<column:' + colName + ' rdf:about="' + identifierBaseUri + '/' + fileName + '/row/' + (index + 1) + '/column/' + self.replaceSpaceToUnderscore(self.validUrl(colVal).trim()) + '(' + fileName + ')"> \n';

        // rdfxml += '\t\t<column:name rdf:parseType="Literal">' + self.trimFieldName(colVocab) + '</column:name> \n';

        if (self.startWithProtocol(colVal)) {
           rdfxml += '\t\t<sheet:columnValue rdf:parseType="Literal">' + self.validUrl(colVal).trim() + '</sheet:columnValue> \n';
        } else {
           rdfxml += '\t\t<sheet:columnValue rdf:parseType="Literal">' + self.validText(colVal).trim() + '</sheet:columnValue> \n';
        }
        rdfxml += '\t</column:' + colName + '> \n'; 
        rdfxml += '\n'; 
      });
    });

    rdfxml += '</rdf:RDF> \n';
    if (callback) { callback(rdfxml); }
    return rdfxml;
  }


  buildCSVObject(csvData, callback) {
    let csvHeaders,
      csvHeaderMap = {},
      csvRows = [],
      result = {
        success: false,
        message: '',
        numOfCols: 0,
        csvData: csvData,
        csvHeaders: [],
        csvHeaderMap: {},
        csvRows: []
      };

    this.parse(csvData, function (csvServiceResult) {

      csvServiceResult.data.forEach(function (csvRow, index) {
        if (index === 0) {
          csvHeaders = csvRow;
          csvRow.forEach(function (header) {
            csvHeaderMap[header] = header;
          });
        } else {
          csvRows.push(csvRow);
        }

        if (index === csvServiceResult.data.length - 1) {
          result.numOfCols = csvHeaders.length;
          result.csvHeaders = csvHeaders;
          result.csvHeaderMap = csvHeaderMap;
          result.csvRows = csvRows;
          result.success = true;
          if (callback) callback(result);
        }
      });
    });
  }

  startWithProtocol(text) {
    let pattern = /^((http|https|ftp):\/\/)/;

    return pattern.test(text);
  }

  trimFieldName(text) {
    text = text.replace(/ /g,'');
    text = text.replace(/\./g,'');
    return text;
  }

  replaceSpaceToUnderscore(text) {
    text = text.replace(/ /g,'_');
    return text;
  }

  validUrl(text) {
    text = text.replace(/&/g,'%26');
    return text;
  }

  validText(text) {
    text = text.replace(/\'/g,'');
    text = text.replace(/\"/g,'');
    return text;
  }

  capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  parse(csvFileContent, callback) {
    let result = {
      success: false,
      message: '',
      data: {}
    };

    this.csv(csvFileContent, {delimiter: ','}, function (err, csvData) {
      if (err) {
        result.message = 'invalid csv: ' + err.toString()
        if (callback) { callback(result) }
      } else {
        result.success = true;
        result.data = csvData;
        if (callback) { callback(result) }
      }
    });
  }

  validate(csvFileContent, callback) {
    let result = {
        success: false,
        message: '',
        file: {}
      }

    this.csv(csvFileContent, {delimiter: ','}, function (err, csvData) {
      if (err) {
        result.message = 'invalid csv: ' + err.toString()
        if (callback) { callback(result) }
        return
      } else {
        let count, foundError = false;

        csvData.forEach(function (csvRow) {
          if (count === undefined) {
            count = csvRow.length
          } else {
            if (count !== csvRow.length) {
              foundError = true;
            }
          }
        })

        if (foundError) {
          result.message = 'invalid csv: number of columns each row is not identical'
          if (callback) { callback(result) }
          return
        } else {
          result.success = true
          result.message = 'valid csv'
          if (callback) { callback(result) }
          return
        }
        
        return
      }
    })

  }
}

module.exports = CsvService
