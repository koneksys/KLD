import Visualizer from '../../../lib/vis';

export default class TypesController {

  constructor($uibModal, apiManagerService, notificationManagerService,
    $scope, $rootScope, $window, $timeout, $log, store) {
    let self = this;

    this.modal = $uibModal;
    this.apiManagerService = apiManagerService;
    this.notifier = notificationManagerService;
    this.vis = new Visualizer(this.apiManagerService, this.notifier);
    this.scope = $scope;
    this.r = $rootScope;
    this.window = $window;
    this.timeout = $timeout;
    this.log = $log;
    this.store = store;
    this.types;
    this.typeInstances;
    this.searchType;
    this.searchLinkedData;
    this.selectedResourceType;

    this.scope.$on('loadTypes', function (event, args) {
      self.listAllResourcesTypes();
    });

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

    this.graph;
  }

  closeAttrs() {
    this.currentAttrContent = '';
    this.collapse = true;
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
      this.sparqlQuery(queryStmt, function (resources) {
        let json;

        try {
          json = JSON.parse(resources);
          self.attrTriples = json;
          self.vis.buildBlock(self.attrTriples.results.bindings, function (processedAttrBlock) {
            self.collapse = false;
            self.attrBlock = processedAttrBlock;
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
    let self = this,
      queryStmt;

    this.collapse = true;
    this.currentPage = pageSelection;
    if (pageSelection > 1) {
      this.offset = this.itemPerPage * (this.currentPage - 1);
    } else if (pageSelection === 1) {
      this.offset = 0;
    } else {

    }
    queryStmt = this.buildStatement(this.currentUri);
    this.sparqlQuery(queryStmt, function (resources) {
      let json;

      try {
        json = JSON.parse(resources);
        self.typeInstances = json.results.bindings;
        self.vis.buildVis(self.typeInstances, self.currentUri, function (graphVisData) {
          self.graph = graphVisData;
        });
      } catch (error) {
        self.notifier.error({message: '<b>Performing SPARQL query on ' +
          self.window.clientId + '\'s dataset</b> <br>Cannot connect to triplestore'});
      }
    });
  }

  listInstances(name, uri, total) {
    let self = this,
      queryStmt;

    this.collapse = true;
    this.total = total;
    this.currentUri = uri;
    this.pages = new Array((Math.ceil(total / this.itemPerPage)));
    this.currentPage = 1;
    this.offset = 0;
    this.selectedResourceType = {name: name, uri: uri};
    queryStmt = this.buildStatement(uri);
    this.sparqlQuery(queryStmt, function (resources) {
      let json;

      try {
        json = JSON.parse(resources);
        self.typeInstances = json.results.bindings;
        self.vis.buildVis(self.typeInstances, self.currentUri, function (graphVisData) {
          self.graph = graphVisData;
        });
      } catch (error) {
        console.error(error);
        self.notifier.error({message: '<b>Performing SPARQL query on ' +
          self.window.clientId + '\'s dataset</b> <br>Cannot connect to triplestore'});
      }
    });
  }

  buildAttrDetailStatement(uri) {
    return 'select * where {  BIND(<' + uri + '> AS ?subject) <' + uri + '> ?predicate ?object }';
  }

  buildStatement(uri) {
    return 'select * where {' +
        '?Resource <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>   <' + uri + '> ; ' +
        '} limit ' + this.itemPerPage + ' offset ' + this.offset ;
  }

  getName(uri) {
    return uri.split('/').pop().split('#').pop();
  }

  sparqlQuery(queryStmt, callback) {
    let self = this;

    this.apiManagerService.fusekiApiPostSparqlQuery(
      {queryStatement: queryStmt, graph: 'http://example.com', format: 'json'}, function (resp) {
      if (resp.success) {
        if (callback) { callback(resp.returnData.resources); }
      } else {
        self.notifier.error({message: '<b>Performing SPARQL query on ' +
          self.window.clientId + '\'s dataset</b> <br>' + resp.message});
      }
    });
  }

  listAllResourcesTypes() {
    let self = this,
      solParams = {
        mode: 'facet',
        facetField: 'p_rdf.type',
        graph: 'union'
      },
      keys,
      maps;

    console.log('listAllResourcesTypes');
    this.r.types = [];
    this.types = [];
    this.apiManagerService.solrApiPostSearch(solParams, function (result) {
      if (result.returnData.content['facet_counts'] !== undefined) {
        maps = result.returnData.content.facet_counts.facet_fields['p_rdf.type'];
        keys = Object.keys(maps);
        if (keys.length === 0) {
          self.r.types = [];
          self.types = [];
        } else {
          keys.forEach(function (map, index) {
            self.types.push({
              uri: map,
              name: map.split('/').pop().split('#').pop(),
              num: maps[map]
            });
            if (keys.length === index + 1) {
              self.r.types = self.types;
            }
          });
        }
      }
    });
  }
}

TypesController.$inject = ['$uibModal',
                          'apiManagerService',
                          'notificationManagerService',
                          '$scope',
                          '$rootScope',
                          '$window',
                          '$timeout',
                          '$log',
                          'store'
                          ];
