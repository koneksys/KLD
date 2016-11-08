'use strict';

let RdfXmlParser = require('rdf-parser-rdfxml'),
  xml2js = require('xml2js');

/**
 * RDFParser class
 * @author Vorachet Jaroensawas <vorachet.jaroensawas@koneksys.com>
 */
class RDFParser {
  constructor() {
    this.rdfParser = new RdfXmlParser();
    this.xmlParser = new xml2js.Parser();
  }

  parseRDFXML(rdfxml, callback) {
    let self = this,
      result = {
        success: false,
        message: '',
        prefixes: [],
        triples: [],
        distinctSubjects: [],
        distinctPredicates: [],
        distinctObjects: [],
      },
      count = 0,
      numOfTriples = 0,
      distinctSubjectsMap = [],
      distinctPredicatesMap = [],
      distinctObjectsMap = [];

    try {
      this.xmlParser.parseString(rdfxml, function (err, xmlResult) {
        let nsObj, namespacesMap, keys, namespaces = [];

        if (!err) {
          if (xmlResult['rdf:RDF'] !== undefined) {
            nsObj = xmlResult['rdf:RDF']

            if (nsObj['$'] !== undefined) {
              namespacesMap = nsObj['$'];
              keys = Object.keys(namespacesMap);
              keys.forEach(function(key) {
                let ns = {
                  prefix: '',
                  uri: ''
                };
                ns.prefix = key.split(':').pop();
                ns.uri = namespacesMap[key];
                result.prefixes.push(ns);
              });
            } else {
              result.message = 'invalid RDF $';
              if (callback) { callback(result) };
            }
          } else {
            result.message = 'invalid RDF';
            if (callback) { callback(result) };
          }
        } else {
          result.message = err.toString();
          console.error(err);
          if (callback) { callback(result) };
        }
      });
    } catch (error) {
      result.message = error.toString();
      console.error(error);
      if (callback) { callback(result) };
    }


    this.rdfParser.parse(rdfxml, function () {
    }).then(function (data) {
      numOfTriples = data._graph.length;
      data._graph.forEach(function(graph) {
        let triple = {};

        triple.subject = {
          uri: graph.subject.nominalValue
        };
        triple.predicate = {
          uri: graph.predicate.nominalValue
        };
        triple.object = {
          isUri: graph.object.interfaceName === 'NamedNode' ? true : false,
          isLiteral: graph.object.interfaceName === 'Literal' ? true : false,
          value: graph.object.nominalValue
        };

        if (graph.object.datatype !== undefined) {
          triple.object.literalDataType = graph.object.datatype.nominalValue;
        }

        if (distinctSubjectsMap[graph.subject.nominalValue] === undefined) {
          result.distinctSubjects.push(graph.subject.nominalValue);
          distinctSubjectsMap[graph.subject.nominalValue] = graph.subject.nominalValue;
        }

        if (distinctPredicatesMap[graph.predicate.nominalValue] === undefined) {
          result.distinctPredicates.push(graph.predicate.nominalValue);
          distinctPredicatesMap[graph.predicate.nominalValue] = graph.predicate.nominalValue;
        }

        if (distinctObjectsMap[graph.object.nominalValue] === undefined) {
          result.distinctObjects.push(graph.object.nominalValue);
          distinctObjectsMap[graph.object.nominalValue] = graph.object.nominalValue;
        }

        result.triples.push(triple);
        count++;

        if (count === numOfTriples) {
          result.success = true;
           result.message = 'Parsed!';
          if (callback) { callback(result) };
        }
      });
    }).catch(function (error) {
      result.message = error.toString();
      console.error(error);
      if (callback) { callback(result) };
    })
  }
}

module.exports = RDFParser;
