'use strict'

let debug = require('debug')('RdfXmlService'),
  RdfXmlParser = require('rdf-parser-rdfxml'),
  xml2js = require('xml2js')

class RdfXmlService {
  constructor() {
    this.rdfParser = new RdfXmlParser()
    this.xmlParser = new xml2js.Parser()
    debug('loaded')
  }

  validate(rdfxml, callback) {
    let self = this,
      result = {
        success: false,
        message: ''
      },
      isCalled = false;

    try {
      this.xmlParser.parseString(rdfxml, function (err, xml) {
        if (err === null || err === undefined) {
          if (xml['rdf:RDF'] !== undefined) {
            self.rdfParser.parse(rdfxml, function (rdfErr, xml) {
              if (rdfErr) {
                result.message = 'invalid RDFXML: ' + rdfErr.toString();
                if (callback && !isCalled) { 
                  isCalled = true;
                  callback(result) 
                }
              } else {
                result.success = true
                result.message = 'valid RDFXML'
                if (callback && !isCalled) { 
                  isCalled = true;
                  callback(result) 
                }
              }
            })
          } else {
            result.message = 'invalid RDFXML: "<rdf:RDF>"" not found'
            if (callback && !isCalled) { 
              isCalled = true;
              callback(result) 
            }
          }
        } else {
          result.message = 'invalid RDFXML: ' + err.toString()
          if (callback && !isCalled) { 
              isCalled = true;
              callback(result) 
            }
        }
      });
    } catch(error) {
      result.message = 'invalid XML: ' + error.toString()
      if (callback && !isCalled) { 
        isCalled = true;
        callback(result) 
      }
    }
    
  }
}

module.exports = RdfXmlService
