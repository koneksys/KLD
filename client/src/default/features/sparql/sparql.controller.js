import Visualizer from '../../../lib/vis';

export default class SparqlController {
  constructor(apiManagerService, notificationManagerService, sessionManagerService, $window, $scope, $rootScope, $log) {
    this.apiManagerService = apiManagerService;
    this.sessionManagerService = sessionManagerService;
    this.notifier = notificationManagerService;
    this.vis = new Visualizer(this.apiManagerService, this.notifier);
    this.window = $window;
    this.scope = $scope;
    this.r = $rootScope;
    this.log = $log;
    this.scope.editorOptions = {
      lineWrapping: true,
      lineNumbers: true,
      mode: 'xml'
    };
    this.format = 'table';
    this.output = '';
    this.downloadUrl = '';
    this.queryStatement = 'SELECT * WHERE {?s ?p ?o}';
    this.countStatement = '';
    this.resultTriples = {};
    this.resultTriplesJson = '';
    this.domain = this.sessionManagerService.get('org').domain +
      '/' + this.sessionManagerService.get('profile').email + '/default';
    this.defaultDomain = this.domain;
    this.permanentLinkBaseUrl = 'http://localhost:8080/sparql?q=';
    this.searchLinkedData;
    this.currentQuestionName = '';
    this.sparqlQuestions = this.sessionManagerService.get('profile').sparqlQuestions;

    this.total = 0;
    this.itemPerPage = 50;
    this.start = 0;
    this.pages = [];
    this.offset = 0;
    this.currentPage = 0;
    this.currentUri = '';
    this.attrs = [];
    this.collapse = true;
    this.currentAttrContent = '<h3>Hello</h3>';
    this.attrTriples = [];
    this.attrBlock;
  }

  closeAttrs() {
    this.currentAttrContent = '';
    this.collapse = true;
  }

  buildAttrDetailStatement(uri) {
    return 'select * where {  BIND(<' + uri + '> AS ?subject) <' + uri + '> ?predicate ?object }';
  }

  showAttrs(uri) {
    let self = this,
      queryStmt;

    this.attrBlock = {
      creationDate: new Date(),
      subject: {
        name: '',
        uri: ''
      },
      predicates: [],
      blocks: []
    };
    if (this.attrs[uri] === undefined) {
      queryStmt = this.buildAttrDetailStatement(uri);
      this.sparqlQuery(queryStmt, self.format, function (resources) {
        let json;

        try {
          json = JSON.parse(resources);
          self.attrTriples = json;

          self.attrTriples.results.bindings.forEach(function (obj, index) {
            console.log(obj);
            self.attrBlock.subject.name = self.humanReadable(obj.subject.value);
            self.attrBlock.subject.uri = obj.subject.value;
            if (self.attrBlock.predicates[obj.predicate.value] === undefined) {
              self.attrBlock.predicates[obj.predicate.value] = {
                uri: obj.predicate.value,
                objects: []
              };
            }
            if (obj.object.type === 'uri') {
              self.attrBlock.predicates[obj.predicate.value].objects.push({
                name: self.humanReadable(obj.object.value),
                uri: obj.object.value
              });
            } else {
              self.attrBlock.predicates[obj.predicate.value].objects.push({
                name: self.humanReadable(obj.object.value),
                uri: obj.object.value + '^^<' + obj.object.datatype + '>'
              });
            }

            if (index === self.attrTriples.results.bindings.length - 1) {
              Object.keys(self.attrBlock.predicates).forEach(function (predicateKey) {
                self.attrBlock.blocks.push({
                  predicateUri: predicateKey,
                  objects: self.attrBlock.predicates[predicateKey].objects
                });
              });
              console.log('self.attrBlock = ', self.attrBlock);
              self.collapse = false;
            }
          });
        } catch (error) {
          self.notifier.error({message: '<b>Performing SPARQL query on ' +
            self.window.clientId + '\'s dataset</b> <br>Cannot connect to triplestore'});
        }
      });
    } else {
      this.collapse = false;
      this.attrs[uri].collapse = false;
      this.currentAttrContent = this.attrs[uri].content;
    }
  }

  nextPage(pageSelection) {
    let self = this;

    this.collapse = true;
    this.currentPage = pageSelection;
    if (pageSelection > 1) {
      this.offset = this.itemPerPage * (this.currentPage - 1);
    } else if (pageSelection === 1) {
      this.offset = 0;
    }
    this.sparqlQuery(self.queryStatement + 'limit ' + self.itemPerPage + ' offset ' + self.offset, self.format,
      function (resources) {
        console.log('resources', resources);

        if (self.format === 'table' || self.format === undefined) {
          try {
            let json = JSON.parse(resources);

            console.log('sparqlQuery', json);
            self.resultTriples = json;
            if (self.resultTriples.results.bindings.length === 0) {
              self.notifier.warning({message: '<b>Resource not found</b>'});
            }
            self.resultTriplesJson = JSON.stringify(self.resultTriples, null, 2);
          } catch (error) {
            self.notifier.error({message: '<b>Performing SPARQL query on ' +
              self.window.clientId + '\'s dataset</b> <br>Cannot connect to triplestore or Invalid SPARQL'});
          }
        } else {
          self.output = resources;
          self.scope.downloadUrl = self.generateExportFileLink(self.format);
        }
      }
    );
  }

  preset(q) {
    let format = 'table';

    this.currentQuestionName = q.name;
    this.queryStatement = q.query;
    this.countStatement = q.count;
    this.execute(format);
  }

  generateExportFileLink(format) {
    let blob = new Blob([this.output], {type: 'text/plain'}),
      url = this.window.URL || this.window.webkitURL;

    return url.createObjectURL(blob);
  }

  humanReadable(value) {
    let v;

    v = value.split('/').pop();
    v = v.replace(/\_/g, ' ');
    return v;
  }

  execute(format) {
    let self = this,
      total = 0,
      uri = '';

    this.format = format;
    this.log.debug('execute() format = ', this.format);

    this.countStatement = this.queryStatement;
    this.log.debug('countStatement = ', this.countStatement);
    this.log.debug('queryStatement = ', this.queryStatement);

    this.sparqlQuery(this.countStatement, this.format, function (countResources) {
      let json = JSON.parse(countResources);

      try {
        if (json.results.bindings.length === 0) {
          self.notifier.warning({message: '<b>Resource not found</b>'});
        } else {
          total = json.results.bindings.length;
          self.collapse = true;
          self.total = total;
          self.currentUri = uri;
          self.pages = new Array((Math.ceil(total / self.itemPerPage)));
          self.currentPage = 1;
          self.offset = 0;

          self.sparqlQuery(self.queryStatement + 'limit ' + self.itemPerPage + ' offset ' + self.offset, format,
            function (resources) {
              self.log.debug('resources = ', resources);

              if (format === 'table' || format === undefined) {
                try {
                  json = JSON.parse(resources);

                  self.resultTriples = json;
                  if (self.resultTriples.results.bindings.length === 0) {
                    self.notifier.warning({message: '<b>Resource not found</b>'});
                  }
                  self.resultTriplesJson = JSON.stringify(self.resultTriples, null, 2);
                } catch (error) {
                  self.notifier.error({message: '<b>Performing SPARQL query on ' +
                    self.window.clientId + '\'s dataset</b> <br>Cannot connect to triplestore or Invalid SPARQL3'});
                }
              } else {
                self.output = resources;
                self.scope.downloadUrl = self.generateExportFileLink(format);
              }
            }
          );
        }
      } catch (error) {
        self.notifier.error({message: '<b>Performing SPARQL query on ' +
          self.window.clientId + '\'s dataset</b> <br>Cannot connect to triplestore or Invalid SPARQL2'});
      }
    });
  }

  saveAsPreset(queryStatement) {
    alert('Not implemented yet');
  }

  sparqlQuery(queryStmt, format, callback) {
    let self = this;

    this.apiManagerService.fusekiApiPostSparqlQuery(
      {queryStatement: queryStmt, graph: self.defaultDomain, format: format}, function (resp) {
      if (resp.success) {
        if (callback) { callback(resp.returnData.resources); }
      } else {
        self.notifier.error({message: '<b>Performing SPARQL query on ' +
          self.window.clientId + '\'s dataset or Invalid SPARQL1</b> <br>' + resp.message});
      }
    });
  }
}

SparqlController.$inject = ['apiManagerService',
                            'notificationManagerService',
                            'sessionManagerService',
                            '$window',
                            '$scope',
                            '$rootScope',
                             '$log'
                           ];
