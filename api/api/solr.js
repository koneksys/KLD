"use strict";

let express = require('express'),
  debug = require('debug')('SolrAPI'),
  router = express.Router(),
  request = require('request'),
  conf = require('../conf/conf.js'),
  url = require('url'),
  BaseAPI = require('./base');


class SolrAPI extends BaseAPI {

  constructor() {
    super();
    let self = this;

    this.request = request;
    this.router = express.Router();

    /* GET /api/solr/ping */
    this.router.get('/ping', function (req, res) {
      let query = url.parse(req.url,true).query;

      debug('/ping query = ', query);
      if (!self.kickUnacceptedKldClient(query, res)) return;
      self.ping(function (result) {
        res.status(200).send(result);
      });
    });

    /* POST /api/solr/delete */
    this.router.post('/delete', function(req, res) {
      let clientId = req.body.clientId,
        deletionString = req.body.deletionString;

      debug('/delete clientId = ', clientId);
      debug('/delete deletionString = ', deletionString);
      if (!self.kickUnacceptedKldClient(req.body, res)) return;
      self.callSolrUpdate(clientId, deletionString, function (retData) {
        if (req.query.callback) {
          res.jsonp(retData)
        } else {
          res.json(retData)
        };
      });
    });

     /* POST /api/solr/search */
    this.router.post('/search', function (req, res) {
      let clientId = req.body.clientId,
        graph = req.body.graph,
        mode = req.body.mode,
        facetField = req.body.facetField,
        q = req.body.q,
        rows = req.body.rows,
        start = req.body.start,
        format = req.body.format,
        is_enabled_facet = req.body.is_enabled_facet,
        facets = req.body.facets,
        isSearchAgaintsPredicate = req.body.isSearchAgaintsPredicate,
        resourceTypeFilters = req.body.resourceTypeFilters,
        isInvalidParams = false,
        validation_data,
        queryPattern,
        fq_queryPattern,
        fq,
        i;

      debug('/search');
      if (!self.kickUnacceptedKldClient(req.body, res)) return;
      if (mode !== undefined && mode === 'facet') {
        if (facetField === undefined) {
          facetField = 'p_rdf.type';
        }

        self.callSolrFacetQuery(clientId, graph, facetField,
          function (isValid , content) {
            let data = {content: ''},
              predefined_content;

            if (isValid) {
              data.content = content;
            } else {
              predefined_content = {
                'response' : {
                  'numFound' : 0,
                  'docs' : []
                }
              };
              data.content = predefined_content;
            }
            if (req.query.callback) {
              res.jsonp(data);
            } else {
              res.json(data);
            }
          }
        );
      } else {
        debug('clientId: ' + clientId);
        debug('q: ' + q);
        debug('graph: ' + graph);
        debug('rows: ' + rows);
        debug('start: ' + start);
        debug('format: ' + format);
        debug('is_enabled_facet: ' + is_enabled_facet);
        debug('facets: ' + facets);
        debug('isSearchAgaintsPredicate: ' + isSearchAgaintsPredicate);
        debug('resourceTypeFilters = ', resourceTypeFilters);

        if (!clientId) {
          isInvalidParams = true;
          validation_data = self.createSolrCallDataModel('clientId');
        } else if (!q) {
          isInvalidParams = true;
          validation_data = self.createSolrCallDataModel('q');
        } else if (!rows) {
          isInvalidParams = true;
          validation_data = self.createSolrCallDataModel('rows');
        } else if (!format) {
          isInvalidParams = true;
          validation_data = self.createSolrCallDataModel('format');
        } else if (!facets && is_enabled_facet) {
          isInvalidParams = true;
          validation_data = self.createSolrCallDataModel('facets');
        } else if (!isSearchAgaintsPredicate === undefined) {
          isInvalidParams = true;
          validation_data = self.createSolrCallDataModel('isSearchAgaintsPredicate');
        } else if (resourceTypeFilters === undefined) {
          isInvalidParams = true;
          validation_data = self.createSolrCallDataModel('resourceTypeFilters');
        } else if (isInvalidParams) {
          debug('Detected invalid parameters');
          if (req.query.callback) {
            res.jsonp(validation_data);
          } else {
            res.json(validation_data);
          }
          return;
        } else {
          debug('All parameters are valid');
        }

        q = q.replace(/\:/g, '%3A');
        q = q.replace(/\#/g, '%23');
        q = q.replace(/\-/g, ' ');

        if (isSearchAgaintsPredicate) {
          queryPattern = q + ':*';
        } else {
          queryPattern = '_text:*' + q + '*';
        }

        fq_queryPattern = '';
        if (resourceTypeFilters.length > 0) {
          fq_queryPattern += 'p_rdf.type:(';
          for (i = 0; i < resourceTypeFilters.length; i++) {
            fq = self.makeFq(resourceTypeFilters[i].uri);
            if (i > 0) { fq_queryPattern += '+OR+'; }
            fq_queryPattern += '*' + fq;
          };
          fq_queryPattern += ')';
        }

        self.callSolrQuery(clientId, graph, queryPattern, fq_queryPattern,
                    rows, start, format, is_enabled_facet, facets,
          function (isValid , content) {
            let data = {content: ''},
              predefined_content;

            if (isValid) {
              data.content = content;
            } else {
              predefined_content = {
                'response' : {
                  'numFound' : 0,
                  'docs' : []
                }
              };
              data.content = predefined_content;
            }
            if (req.query.callback) {
              res.jsonp(data);
            } else {
              res.json(data);
            }
          }
        );
      }
    });
  }

  ping(callback) {
    debug('ping()');
    if (callback) { callback({success: true}); }
  }

  createSolrCallDataModel(paramName) {
    let data = {
      isValid: false,
      message: paramName + ' parameter cannot be empty',
      content: []
    };

    debug('createSolrCallDataModel() paramName = ', paramName);
    return data;
  }

  makeFq(urlInput) {
    let hash = urlInput.split('/').pop().split('#'), hashText = '', fq;

    debug('makeFq() urlInput = ', urlInput);
    if (hash.length > 1) {
      hashText = '#' + hash.pop();
    }
    fq = url.parse(urlInput).pathname + hashText;
    fq = fq.replace(/\#/g, '%23');
    fq = fq.replace(/\//g, '%2F');
    return fq;
  }

  loadClientSolrQueryProperties(clientId) {
    let solrHost = conf.acceptedClients[clientId].solrHost,
      solrPort = conf.acceptedClients[clientId].solrPort,
      solrApiUrl = 'http://' + solrHost + ':' + solrPort + '/solr/' + clientId + '/select';

    return solrApiUrl;
  }

  loadClientSolrUpdateProperties(clientId) {
    let solrHost = conf.acceptedClients[clientId].solrHost,
      solrPort = conf.acceptedClients[clientId].solrPort,
      solrApiUrl = 'http://' + solrHost + ':' + solrPort + '/solr/' + clientId + '/update?commit=true&stream.body=';

    return solrApiUrl;
  }

  callSolrUpdate(clientId, deletionString, callback) {
    let url = this.loadClientSolrUpdateProperties(clientId) + deletionString,
      result = {
        success : false,
        message: ''
      };

    debug('callSolrUpdate() url = ', url);
    this.request.get({url: url, timeout: conf.httpRequestTimeout}, function (error, response, body) {
      if (error) {
        result.message = error.toString();
        debug(result);
        callback(result);
      } else {
        if (response.statusCode === 200) {
          result.success = true;
          debug(result);
          callback(result);
        } else {
          result.message = 'status = ' + response.statusCode;
          debug(result);
          callback(result);
        }
      }
    });
  }

  callSolrFacetQuery(clientId, graph, facetField, callback) {
    let url,
      result,
      resourceTypeKeys;

    if (graph === 'union') {
      url = this.loadClientSolrQueryProperties(clientId) +
        '?q=' + facetField + ':*' +
        '&wt=json' +
        '&indent=true' +
        '&rows=0' + 
        '&facet=true' +
        '&facet.limit=-1' + 
        '&facet.field=' + facetField +
        '&json.nl=map';
    } else {
      url = this.loadClientSolrQueryProperties(clientId) +
        '?q=(' + facetField + ':* AND p_graph:*' + graph + ')' +
        '&wt=json' +
        '&indent=true' +
        '&rows=0' + 
        '&facet=true' +
        '&facet.limit=-1' + 
        '&facet.field=' + facetField +
        '&json.nl=map';
    }
    debug('\t callSolrFacetQuery() url: ', url);
    this.request.get({url: url, timeout: conf.httpRequestTimeout}, function (error, response, body) {
      if (error) {
        callback(false, error.toString() + ' Please contact admin');
      } else {
        if (response.statusCode === 200) {
          result= JSON.parse(body);
          debug('\t result: ', result);
          callback(true, result);
        } else {
          if (response.statusCode === 400) {
            callback(false, 'Error at Solr. Please contact admin');
          } else {
            callback(false, 'Error ' + response.statusCode +
                            ': Cannot connect to SOLR. Please contact admin');
          }
        }
      }
    });
  }

  callSolrQuery(clientId, graph, q, fqQueryPattern, rows, start, format, isEnabledFacet, facets, callback) {
    let url;

    if (graph === 'union') {
      url = this.loadClientSolrQueryProperties(clientId) +
        '?q=' + q + 
        '&fq=' + fqQueryPattern +
        '&wt=' + format +
        '&rows=' + rows +
        '&start=' + start +
        '&indent=true' +
        '&facet=' + isEnabledFacet + facets +
        '&sort=_version_%20desc';
    } else {
      url = this.loadClientSolrQueryProperties(clientId) +
        '?q=(' + q + ' AND p_graph:"'  + graph + '")' + 
        '&fq=' + fqQueryPattern +
        '&wt=' + format +
        '&rows=' + rows +
        '&start=' + start +
        '&indent=true' +
        '&facet=' + isEnabledFacet + facets +
        '&sort=_version_%20desc';
    }

    debug('callSolrQuery() url = ', url);
    this.request.get({url: url, timeout: conf.httpRequestTimeout}, function (error, response, body) {
      if (error) {
        callback(false, error.toString() + ' Please contact admin');
      } else {
        if (response.statusCode === 200) {
          debug('\t numFound: ' + JSON.parse(body).response.numFound);
          callback(true,JSON.parse(body));
        } else {
          if (response.statusCode === 400) {
            callback(false, 'Error at Solr. Please contact admin');
          } else {
            callback(false, 'Error ' + response.statusCode +
                            ': Cannot connect to SOLR. Please contact admin');
          }
        }
      }
    });
  }

  getRouter() {
    return this.router;
  }
}

module.exports = SolrAPI;

