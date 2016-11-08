import PredicateSelectionDialogController from './predicateSelectionDialog.controller';

export default class SearchController {

  constructor($q, $rootScope, $scope, $cookies,
              $location, $filter, $sce, $uibModal, apiManagerService,
              notificationManagerService, sessionManagerService, $window, $log) {
    let self = this;

    this.modal = $uibModal;
    this.r = $rootScope;
    this.scope = $scope;
    this.window = $window;
    this.log = $log;
    this.sessionManagerService = sessionManagerService;
    this.modal = $uibModal;
    this.cookies = $cookies;
    this.q = $q;
    this.rootScope = $rootScope;
    this.location = $location;
    this.sce = $sce;
    this.apiManagerService = apiManagerService;
    this.notifier = notificationManagerService;
    this.domain = this.sessionManagerService.get('org').domain +
      '/' + this.sessionManagerService.get('profile').email + '/default';
    this.defaultDomain = this.domain;
    this.filter = $filter;
    this.searchResourceType = '';
    this.rdfTypes = [];
    this.rdfTypesCount = [];
    this.rdfTypesText = [];
    this.rdfTypesDict = [];
    this.rdfTypesTextsDict = [];
    this.datasetSearchScope = 'union';
    this.searchHistory = [];
    this.mapping;
    this.hashPrefixes = [];
    this.hashPrefixesCollection = [];
    this.fullTextSearchText;
    this.hiddenFullTextSearchText;
    this.includedUri;
    this.filterSubject = true;
    this.filterPredicate = true;
    this.filterObject = true;
    this.searchSpecContent;
    this.ENABLED_SECOND_ORDER_SEARCH = true;
    this.searchByPredicateLink = '';
    this.searchByPredicateQuery = '';
    this.searchByPredicateMatchedPredicates = [];
    this.MAX_RESULT_ITEM_PER_PAGE = 10;
    this.currentTriples;
    this.includedUri = false;
    this.tempcurrentTriples = {count: 0, results: []};
    this.fullTextLimits = [10, 50, 100, 300, 500, 1000, 2500, 5000];
    this.fullTextLimit = 100;
    this.fullTextShowUri = true;
    this.checkboxInSidebarClass = 'pointer';
    this.disabledCheckListInSideBar = false;
    this.pointerCursor = true;
    this.waitCursor = false;
    this.hasInvisiblePreviousPagination = false;
    this.hasInvisibleNextPagination = false;
    this.visualization_store_id = '';
    this.workspace = {items: [], keys: []};
    this.workspace_subject = {items: [], keys: []};
    this.workspace_predicate = {items: [], keys: []};
    this.workspace_object = {items: [], keys: []};
    this.isShowResourceTypeUri = true;

    this.loadMappingConfData();
    this.prepareRdfTypes();

    this.scope.$on('refreshUI', function (event, args) {
      self.loadMappingConfData();
      self.prepareRdfTypes();
    });

    this.scope.$on('clearWorkspace', function (event, args) {
      self.workspace_subject.items = [];
      self.workspace_subject.keys = [];
      self.workspace_predicate.items = [];
      self.workspace_predicate.keys = [];
      self.workspace_object.items = [];
      self.workspace_object.keys = [];
    });

    this.scope.$on('lars', function (event, args) {
      let i, id;

      for (i = 0; i < self.workspace_subject.items.length; i++) {
        id = self.workspace_subject.items[i].subject_uri;
        if (id === args.resource_uri) {
          self.workspace_subject.items.splice(i, 1);
          delete self.workspace_subject.keys[args.resource_uri];
          break;
        }
      };
    });

    this.scope.$on('larp', function (event, args) {
      let i, id;

      for (i = 0; i < self.workspace_predicate.items.length; i++) {
        id = self.workspace_predicate.items[i].predicate_uri;
        if (id === args.resource_uri) {
          self.workspace_predicate.items.splice(i, 1);
          delete self.workspace_predicate.keys[args.resource_uri];
          break;
        }
      };
    });

    this.scope.$on('laro', function (event, args) {
      let i, id;

      for (i = 0; i < self.workspace_object.items.length; i++) {
        id = self.workspace_object.items[i].object_uri;
        if (id === args.resource_uri) {
          self.workspace_object.items.splice(i, 1);
          delete self.workspace_object.keys[args.resource_uri];
          break;
        }
      };
    });
  }

  selectPredicateInDialog(content, callback) {
    this.modal.open({
      animation: true,
      template: require('./predicateSelectionDialog.html'),
      controller: PredicateSelectionDialogController,
      controllerAs: 'dialog',
      backdrop: 'static',
      size: 'lg',
      resolve: {
        content: function () {
          return content;
        },
        callback: function () {
          return callback;
        }
      }
    });
  }

  prepareRdfTypes() {
    let self = this;

    this.lookupRdfTypes().then(function (retObject) {
      let rdfTypesCount = retObject.rdfTypesCount,
        rdfTypes = retObject.rdfTypes,
        rdfTypesTexts = retObject.rdfTypesTexts,
        rdfTypesDict = retObject.rdfTypesDict,
        rdfTypesTextsDict = retObject.rdfTypesTextsDict;

      self.rdfTypesCount = rdfTypesCount;
      self.rdfTypes = rdfTypes;
      self.rdfTypesTexts = rdfTypesTexts;
      self.rdfTypesDict = rdfTypesDict;
      self.rdfTypesTextsDict = rdfTypesTextsDict;
    });
  }

  uuid() {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
      s4() + '-' + s4() + s4() + s4();
  }

  openPredicateSelectionDialog(query, matchedPredicates) {
    let self = this,
      content = {
        query: query,
        matches: matchedPredicates
      },
      selectedPredicate;

    this.selectPredicateInDialog(content, function (selectionResult) {
      let currentPage,
        isSearchAgaintsPredicate,
        isOnResourceTypeFilter,
        secondOrderSearchParameters,
        _2ndOrderSearchHistory,
        tripleObjects,
        currentResourceTypeFilters;

      if (selectionResult.success) {
        selectedPredicate = selectionResult.selectedPredicate;
        currentPage = 1;
        isSearchAgaintsPredicate = true;
        isOnResourceTypeFilter = false;
        secondOrderSearchParameters =
          self.prepareSolrCallParameters(
            selectedPredicate.matchedSolrIndexField,
            currentPage,
            isSearchAgaintsPredicate,
            isOnResourceTypeFilter
          );
        self.searchOnSolr(secondOrderSearchParameters, function (_2ndOrderSolrDocs) {
          _2ndOrderSearchHistory = {};
          _2ndOrderSearchHistory.id = self.uuid();
          _2ndOrderSearchHistory.date = new Date();
          _2ndOrderSearchHistory.query = selectedPredicate.matchedSolrIndexField;
          _2ndOrderSearchHistory.queryText = selectedPredicate.matchedPredicate;
          _2ndOrderSearchHistory.isSearchAgaintsPredicate = true;
          _2ndOrderSearchHistory.includedUri = self.includedUri;
          _2ndOrderSearchHistory.resourceTypeFilters = [];
          _2ndOrderSearchHistory.filterSubject = true;
          _2ndOrderSearchHistory.filterPredicate = true;
          _2ndOrderSearchHistory.filterObject = true;
          _2ndOrderSearchHistory.matched_count = _2ndOrderSolrDocs.response.numFound;
          _2ndOrderSearchHistory.loaded_triple_count = _2ndOrderSolrDocs.response.numFound;
          _2ndOrderSearchHistory.numFound = _2ndOrderSolrDocs.response.numFound;
          self.filterSubject = true;
          self.filterPredicate = true;
          self.filterObject = true;
          self.addSearchHistory(_2ndOrderSearchHistory);
          _2ndOrderSolrDocs.query = selectedPredicate.matchedSolrIndexField;
          self.fullTextSearchText = selectedPredicate.matchedPredicate;
          tripleObjects = self.convertSolrDocsToTripleObjects(_2ndOrderSolrDocs);
          currentResourceTypeFilters = [];
          self.processFilterResourceType(
            tripleObjects,
            _2ndOrderSolrDocs,
            currentResourceTypeFilters,
            function (modifiedTripleObjects, modifiedSolrDocs, resourceTypeFilters) {
              currentPage = 1;
              self.displaySearchResult(
                _2ndOrderSearchHistory,
                modifiedSolrDocs,
                modifiedTripleObjects,
                currentPage
              );
              self.searchSpecContent =
                self.buildSearchSpecHtml(_2ndOrderSearchHistory, resourceTypeFilters);
              self.hiddenFullTextSearchText = self.fullTextSearchText;
              self.fullTextSearchText = '';
            }
          );
        });
      }
    });
  }

  lookupRdfTypes() {
    let rdfTypes = [],
      rdfTypesTexts = [],
      rdfTypesDict = [],
      rdfTypesTextsDict = [],
      i,
      num,
      item,
      retObject,
      q = this.q.defer();

    this.loadRdfTypes(function (triples) {
      num = triples.length;
      if (num === 0) { q.reject(null); }
      for (i = 0; i < num; i++) {
        item = {
          uri: triples[i],
          title: triples[i].split('/').pop().split('#').pop(),
          isFilterOn: false
        };
        rdfTypesDict[item.uri] = item;
        rdfTypes.push(item);
        rdfTypesTextsDict[item.uri] = item.title;
        rdfTypesTexts.push(item.title);
        if (i === (num - 1)) {
          retObject = {
            rdfTypesCount: num,
            rdfTypes: rdfTypes,
            rdfTypesDict: rdfTypesDict,
            rdfTypesTexts: rdfTypesTexts,
            rdfTypesTextsDict: rdfTypesTextsDict
          };
          q.resolve(retObject);
        }
      };
    });
    return q.promise;
  };

  showResourceTypeUri(isShowResourceTypeUri) {
    this.isShowResourceTypeUri = isShowResourceTypeUri;
  }

  resetResourceTypeFilter() {
    let i;

    for (i = 0; i < this.rdfTypes.length; i++) {
      this.rdfTypes[i].isFilterOn = false;
      this.rdfTypesText[i] = false;
    };
  }

  turnOnResourceType(typeSourceUri) {
    let i;

    for (i = 0; i < this.rdfTypes.length; i++) {
      if (this.rdfTypes[i].uri === typeSourceUri) {
        this.rdfTypes[i].isFilterOn = !this.rdfTypes[i].isFilterOn;
        if (this.hiddenFullTextSearchText !== undefined) {
          this.processSearchFromTextInput(this.hiddenFullTextSearchText);
        }
        break;
      }
    };
  }

  addSubjectToWorkspace(tripleObj) {
    this.workspace_subject.items.push(tripleObj);
    this.workspace_subject.keys[tripleObj.subject_uri] = tripleObj;
    this.rootScope.$broadcast('addSubjectToWorkspace', {triple: tripleObj});
  }

  removeSubjectFromWorkspace(tripleObj) {
    let i, id;

    for (i = 0; i < this.workspace_subject.items.length; i++) {
      id = this.workspace_subject.items[i].subject_uri;
      if (id === tripleObj.subject_uri) {
        this.rootScope.$broadcast('removeSubjectFrom Workspace', {triple: tripleObj});
        this.workspace_subject.items.splice(i, 1);
        delete this.workspace_subject.keys[tripleObj.subject_uri];
        break;
      }
    };
  }

  isSubjectExistInWorkspace(tripleObj) {
    if (this.workspace_subject.keys[tripleObj.subject_uri]) {
      return true;
    }
    return false;
  }

  addPredicateToWorkspace(tripleObj) {
    this.workspace_predicate.items.push(tripleObj);
    this.workspace_predicate.keys[tripleObj.predicate_uri] = tripleObj;
    this.rootScope.$broadcast('addPredicateToWorkspace', {triple: tripleObj});
  }

  removePredicateFromWorkspace(tripleObj) {
    let i, id;

    for (i = 0; i < this.workspace_predicate.items.length; i++) {
      id = this.workspace_predicate.items[i].predicate_uri;
      if (id === tripleObj.predicate_uri) {
        this.rootScope.$broadcast('removePredicateFromWorkspace', {triple: tripleObj});
        this.workspace_predicate.items.splice(i, 1);
        delete this.workspace_predicate.keys[tripleObj.predicate_uri];
        break;
      }
    };
  }

  isPredicateExistInWorkspace(tripleObj) {
    if (this.workspace_predicate.keys[tripleObj.predicate_uri]) {
      return true;
    }
    return false;
  }

  addObjectToWorkspace(tripleObj) {
    this.workspace_object.items.push(tripleObj);
    this.workspace_object.keys[tripleObj.object_uri] = tripleObj;
    this.rootScope.$broadcast('addObjectToWorkspace', {triple: tripleObj});
  }

  removeObjectFromWorkspace(tripleObj) {
    let i, id;

    for (i = 0; i < this.workspace_object.items.length; i++) {
      id = this.workspace_object.items[i].object_uri;
      if (id === tripleObj.object_uri) {
        this.rootScope.$broadcast('removeObjectFromWorkspace', {triple: tripleObj});
        this.workspace_object.items.splice(i, 1);
        delete this.workspace_object.keys[tripleObj.object_uri];
        break;
      }
    };
  }

  isObjectExistInWorkspace(tripleObj) {
    if (this.workspace_object.keys[tripleObj.object_uri]) {
      return true;
    }
    return false;
  }

  loadMappingConfData() {
    let self = this, queryVars = {};

    this.apiManagerService.fusekiApiGetFusekiMapping(queryVars, function (resp) {
      if (resp.returnData.success) {
        // self.notifier.success({message: 'SearchApp: Predicate List Loaded'});
        self.mapping = resp.returnData.mapping;
        self.hashPrefixes = resp.returnData.hashPrefixes;
        self.r.hashPrefixes = self.hashPrefixes;
        Object.keys(self.hashPrefixes).forEach(function (prefix) {
          self.hashPrefixesCollection.push({prefix: prefix, uri: self.hashPrefixes[prefix]});
        });
        self.r.$broadcast('loadTypes', {});
      }
    });
  }

  getResourceTypeFilters() {
    let resourceTypeFilters = [], i;

    for (i = 0; i < this.rdfTypes.length; i++) {
      if (this.rdfTypes[i].isFilterOn) {
        resourceTypeFilters.push(
          { index: i,
            uri: this.rdfTypes[i].uri,
            title: this.rdfTypes[i].uri.split('/').pop().split('#').pop()
          }
        );
      }
    };
    return resourceTypeFilters;
  }

  alphabetical(a, b) {
    let aTitle = a.split('/').pop().split('#').pop();
    let bTitle = b.split('/').pop().split('#').pop();
    let A = aTitle.toLowerCase();
    let B = bTitle.toLowerCase();

    if (A < B) {
      return -1;
    } else if (A > B) {
      return 1;
    }

    return 0;
  }

  loadRdfTypes(callback) {
    let queryStmt = 'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> ' +
          'SELECT DISTINCT ?type ' +
          'WHERE { ' +
          '    ?subject  rdf:type ?type . ' +
          '}',
      triples = [],
      object,
      i,
      self = this;

    this.apiManagerService.fusekiApiPostSparqlQuery(
      {queryStatement: queryStmt, graph: 'http://example.com', format: 'json'}, function (resp) {
      let json;

      try {
        json = JSON.parse(resp.returnData.resources);
        if (resp.success) {
          if (resp.returnData.success) {
            for (i = 0; i < json.results.bindings.length; i++) {
              object = json.results.bindings[i];
              triples.push(object.type.value);
            }
            triples.sort(self.alphabetical);
            callback(triples);
          } else {
            callback(triples);
          }
        }
      } catch (error) {
        self.notifier.error({message: 'Cannot connect to graph database'});
      }
    });
  }

  prepareSolrCallParameters(query, currentPage, isSearchAgaintsPredicate, resourceTypeFilters) {
    let modified_query,
      data,
      start,
      graph = this.datasetSearchScope;

    modified_query = query;
    modified_query = modified_query.replace(/\:/g, '%5F');
    modified_query = modified_query.replace(/\#/g, '%23');
    modified_query = modified_query.replace(/\-/g, ' ');

    data = {};

    if (currentPage === 1) {
      start = 0;
      data = {
        format: 'json',
        graph: graph,
        q: modified_query,
        is_enabled_facet: false,
        rows: this.MAX_RESULT_ITEM_PER_PAGE,
        start: start,
        facets: '',
        isSearchAgaintsPredicate: isSearchAgaintsPredicate,
        resourceTypeFilters: resourceTypeFilters
      };

    } else if (currentPage > 1) {
      start = (currentPage - 1) * this.MAX_RESULT_ITEM_PER_PAGE;
      data = {
        format: 'json',
        graph: graph,
        q: modified_query,
        is_enabled_facet: false,
        rows: this.MAX_RESULT_ITEM_PER_PAGE,
        start: start,
        facets: '',
        isSearchAgaintsPredicate: isSearchAgaintsPredicate,
        resourceTypeFilters: resourceTypeFilters
      };
    } else {
      // Do nothing
    }

    return data;
  }

  getPrefixesCollection() {
    return this.hashPrefixesCollection;
  }

  convertSolrDocsToTripleObjects(solrDocs) {
    let self = this,
      tripleObjects = [],
      tripleObject = {},
      lineDoc,
      predicatePrefix,
      predicateVocab,
      predicateUri,
      i,
      solrDocKey,
      solrReturnDocsLength = solrDocs.response.docs.length;

    console.log('self.hashPrefixes = ', self.hashPrefixes);
    for (i = 0; i < solrReturnDocsLength; i++) {
      tripleObject = {};
      lineDoc = solrDocs.response.docs[i];
      console.log('lineDoc = ', lineDoc);
      Object.keys(lineDoc).forEach(function (key, index) {
        console.log('1st key = ', key);
        if (key !== 'uri' && key !== 'id' && key !== '_version_' && key !== 'p_graph') {
          console.log('key = ', key);
          solrDocKey = key.replace('p_', '');
          predicatePrefix = solrDocKey.split('.')[0];
          console.log('solrDocKey = ', solrDocKey);
          predicateVocab = solrDocKey.replace(predicatePrefix + '.', '');
          tripleObject.predicate_name = predicatePrefix + ':' + predicateVocab;
          console.log('predicate_name = ', tripleObject.predicate_name);
          predicateUri = self.hashPrefixes[predicatePrefix];
          console.log('predicatePrefix = ', predicatePrefix);
          predicateUri = predicateUri.replace('<', '');
          predicateUri = predicateUri.replace('>', '');
          predicateUri += predicateVocab;
          tripleObject.predicate_uri = predicateUri;
          tripleObject.object_uri = lineDoc[key][0];
          if (tripleObject.object_uri.split('/') !== undefined) {
            tripleObject.object_name = tripleObject.object_uri.split('/').pop().split('#').pop();
          } else {
            tripleObject.object_name = tripleObject.object_uri;
          }
        } else {
          if (key === 'uri') {
            tripleObject.subject_uri = lineDoc.uri[0];
            if (tripleObject.subject_uri.split('/') !== undefined) {
              tripleObject.subject_name = tripleObject.subject_uri.split('/').pop().split('#').pop();
            } else {
              tripleObject.subject_name = tripleObject.subject_uri;
            }
          }

          if (key === 'p_graph') {
            tripleObject.graph = lineDoc.p_graph[0].split(',')[0];
          }
        }
      });

      tripleObject.id = solrDocs.response.docs[i].id;
      tripleObjects.push(tripleObject);
    }
    return tripleObjects;
  }

  processFilterResourceType(tripleObjects, solrDocs, resourceTypeFilters, callback) {
    let modifiedTripleObjects = [],
      i, j;

    if (resourceTypeFilters.length > 0) {
      for (i = tripleObjects.length - 1; i >= 0; i--) {
        for (j = 0; j < resourceTypeFilters.length; j++) {
          if (tripleObjects[i].predicate_uri === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type' &&
              resourceTypeFilters[j].uri === tripleObjects[i].object_uri) {
            modifiedTripleObjects.push(tripleObjects[i]);
          }
        };
      };
    } else {
      modifiedTripleObjects = tripleObjects;
    }
    callback(modifiedTripleObjects, solrDocs, resourceTypeFilters);
  }

  addSearchHistory(searchHistory, resourceTypeFilters) {
    let filter_s,
      filter_p,
      filter_o,
      html = '',
      i,
      title,
      uri;

    if (searchHistory.filterSubject) {
      filter_s = '<span class="label label-primary">s</span>&nbsp;';
    } else {
      filter_s = '';
    }

    if (searchHistory.filterPredicate) {
      filter_p = '<span class="label label-danger">p</span>&nbsp;';
    } else {
      filter_p = '';
    }

    if (searchHistory.filterObject) {
      filter_o = '<span class="label label-info">o</span>&nbsp;';
    } else {
      filter_o = '';
    }

    html += '<p>';

    if (!searchHistory.filterSubject && !searchHistory.filterPredicate && !searchHistory.filterObject) {
      html += '<span>no filters</span> ';
    } else {
      html += filter_s + filter_p + filter_o;
    }

    html += '<strong>' + searchHistory.queryText +
            ' (triple=' + this.filter('number')(searchHistory.numFound) + ')</strong><p>';

    if (resourceTypeFilters !== undefined && resourceTypeFilters.length > 0) {
      for (i = 0; i < resourceTypeFilters.length; i++) {
        title = resourceTypeFilters[i].title;
        uri = resourceTypeFilters[i].uri;
        html += '<span class="label label-success">' +
                 title +
                '</span> &nbsp;' + uri + '<br>';
      }
    }

    // html += '</p><small>' + searchHistory.date + '</small>';
    searchHistory.html = html;
    this.searchHistory.push(searchHistory);
  }

  buildSearchSpecHtml(searchHistory, resourceTypeFilters) {
    let filter_s,
      filter_p,
      filter_o,
      html = '',
      i,
      uri,
      title;

    if (searchHistory.filterSubject) {
      filter_s = '<span class="label label-primary"><b>S</b></span> ';
    } else {
      filter_s = '';
    }

    if (searchHistory.filterPredicate) {
      filter_p = '<span class="label label-danger"><b>P</b></span> ';
    } else {
      filter_p = '';
    }

    if (searchHistory.filterObject) {
      filter_o = '<span class="label label-info"><b>O</b></span> ';
    } else {
      filter_o = '';
    }

    html += '<p>';
    if (!searchHistory.filterSubject && !searchHistory.filterPredicate && !searchHistory.filterObject) {
      html += '<span class="label label-default">no filters</span> ';
    } else {
      html += '<span>' + filter_s + filter_p + filter_o + ' </span> &nbsp;';
    }
    html += '<strong>' + searchHistory.queryText + '</strong></p>';

    if (resourceTypeFilters !== undefined && resourceTypeFilters.length > 0) {
      html += '<b>Resource Type Filter</b>: ';
      html += '<div>';
      for (i = 0; i < resourceTypeFilters.length; i++) {
        uri = resourceTypeFilters[i].uri;
        title = resourceTypeFilters[i].title;
        html += '<span class="label label-default">' + title +
                '</span>  <small><a target="resTypeUri" href="' + uri + '">' + uri + '</a></small> &nbsp;';
      }
      html += '</div>';
    }
    return html;
  }

  displaySearchResult(searchHistory, solrDocs, tripleObjects, current_page) {
    let numFound,
      num_of_pages,
      paging_items,
      paging_title,
      currentTriples = {};

    if (solrDocs.responseHeader === undefined) {
      this.notifier.error({message: '<b>Cannot not connect to search engine</b>'});
      return;
    }

    numFound = solrDocs.response.numFound;
    num_of_pages = Math.ceil(numFound / this.MAX_RESULT_ITEM_PER_PAGE);
    paging_items = this.createPaginationItems(num_of_pages);
    paging_title = this.generatePaginationTitle(
                    current_page,
                    num_of_pages,
                    this.MAX_RESULT_ITEM_PER_PAGE,
                    solrDocs.responseHeader.params.start,
                    numFound,
                    tripleObjects.length
                   );
    currentTriples = {
      searchHistory: searchHistory,
      query: solrDocs.query,
      current_page: current_page,
      num_of_pages: num_of_pages,
      paging_items: paging_items,
      paging_title: paging_title,
      results: tripleObjects
    };
    this.currentTriples = currentTriples;
  }

  createPaginationItems(numOfPages) {
    let paging_items = [],
      paging_item,
      i;

    for (i = 0; i < numOfPages; i++) {
      paging_item = {page_num: i + 1};
      paging_items.push(paging_item);
    };
    return paging_items;
  }

  generatePaginationTitle(current_page, num_of_pages, max_items_per_page, start, numFound, tripleObjectsLength) {
    let paging_title;

    start = parseInt(start, 10); /* the radix is 10 (decimal) */
    paging_title = '';
    if (current_page === num_of_pages) {
      paging_title = 'Showing ' + this.filter('number')(start + 1) +
        ' to ' + this.filter('number')(start + tripleObjectsLength) +
        ' of ' + this.filter('number')(numFound) +
        ' linked data resources in <b>Dataset</b>=<b>' + this.datasetSearchScope + '</b>';
    } else {
      paging_title = 'Showing ' + this.filter('number')(start + 1) +
        ' to ' + this.filter('number')(start + max_items_per_page) +
        ' of ' + this.filter('number')(numFound) +
        ' linked data resources in <b>Dataset</b>=<b>' + this.datasetSearchScope + '</b>';
    }
    return paging_title;
  }

  renderVisualizations(currentTriples) {
  }

  findMatchPredicate(query) {
    let self = this,
      rex = new RegExp(query, 'i'),
      matches = [],
      predicate,
      matching,
      prefixName,
      match;

    Object.keys(this.mapping.maps).forEach(function (solrField, index) {
      predicate = self.mapping.maps[solrField];
      matching = predicate.match(rex);
      if (matching !== null) {
        prefixName = predicate.split(':')[0];
        match = {
          matchedPredicate: predicate,
          matchedSolrIndexField: solrField,
          matchedPrefixName: prefixName,
          matchedPrefixUri: self.hashPrefixes[prefixName]
        };
        matches.push(match);
      }
    });
    return matches;
  }

  validateQuery(query, callback) {
    let v1 = query === undefined || query === null || query.length === 1,
      v2 = query.indexOf('*') === 0,
      v3,
      singleAsterisk;

    if (v1) {
      this.notifier.error({message: 'Search word cannot be empty or must have at least 2 characters'});
      callback(false);
    } else {
      if (v2) {
        this.notifier.error({message: 'Search term cannot start with asterisk character (*)'});
        callback(false);
      } else {
        singleAsterisk = query.indexOf('*');
        v3 = singleAsterisk !== -1 && query.indexOf('*', singleAsterisk + 1) !== -1;
        if (v3) {
          this.notifier.error({message: 'Search term cannot contain more than two asterisk characters (**)'});
          callback(false);
        } else {
          callback(true);
        }
      }
    }
  }

  kldUtilGetGuid() {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
      s4() + '-' + s4() + s4() + s4();
  }

  searchOnSolr(paramJson, callback) {
    let self = this;

    this.apiManagerService.solrApiPostSearch(paramJson, function (resp) {
      if (resp.success) {
        console.log('searchOnSolr', resp);
        callback(resp.returnData.content);
      } else {
        self.notifier.error({message: 'Cannot connect to Solr'});
      }
    });
  }

  processSearchFromTextInput(query) {
    let self = this,
      currentPage,
      isSearchAgaintsPredicate,
      currentResourceTypeFilters,
      firstOrderSearchParameters,
      tripleObjects,
      searchHistory,
      matchedPredicates,
      pluPred;

    this.validateQuery(query, function (isValid) {
      if (isValid) {
        currentPage = 1;
        isSearchAgaintsPredicate = false;
        currentResourceTypeFilters = self.getResourceTypeFilters();
        firstOrderSearchParameters =
          self.prepareSolrCallParameters(
            query,
            currentPage,
            isSearchAgaintsPredicate,
            currentResourceTypeFilters);

        self.searchOnSolr(firstOrderSearchParameters, function (solrDocs) {
          solrDocs.query = query;
          tripleObjects = self.convertSolrDocsToTripleObjects(solrDocs);
          self.processFilterResourceType(tripleObjects, solrDocs, currentResourceTypeFilters,
            function (modifiedTripleObjects, modifiedSolrDocs, resourceTypeFilters) {
              searchHistory = {};
              searchHistory.id = self.kldUtilGetGuid();
              searchHistory.date = new Date();
              searchHistory.query = query;
              searchHistory.queryText = query;
              searchHistory.isSearchAgaintsPredicate = false;
              searchHistory.includedUri = self.includedUri;
              searchHistory.filterSubject = self.filterSubject;
              searchHistory.filterPredicate = self.filterPredicate;
              searchHistory.filterObject = self.filterObject;
              searchHistory.matched_count = solrDocs.response.numFound;
              searchHistory.loaded_triple_count = solrDocs.response.numFound;
              searchHistory.numFound = solrDocs.response.numFound;
              searchHistory.resourceTypeFilters = resourceTypeFilters;

              self.fullTextSearchText = searchHistory.queryText;
              self.addSearchHistory(searchHistory, resourceTypeFilters);
              self.searchSpecContent =
                self.buildSearchSpecHtml(searchHistory,
                                         searchHistory.resourceTypeFilters);
              self.displaySearchResult(
                searchHistory,
                modifiedSolrDocs,
                modifiedTripleObjects,
                currentPage
              );
              self.hiddenFullTextSearchText = self.fullTextSearchText;
              self.fullTextSearchText = '';
            });

          if (self.ENABLED_SECOND_ORDER_SEARCH) {
            matchedPredicates = self.findMatchPredicate(query);

            if (matchedPredicates.length > 0) {
              pluPred = '';
              if (matchedPredicates.length > 1) {
                pluPred = 's';
              }
              self.searchByPredicateLink = 'Your search <b>' + query + '</b> is matched to ' +
                                           matchedPredicates.length +
                                           ' predicate' + pluPred + '.';
              self.searchByPredicateQuery = query;
              self.searchByPredicateMatchedPredicates = matchedPredicates;

            } else {
              self.searchByPredicateLink = '';
              self.searchByPredicateQuery = '';
              self.searchByPredicateMatchedPredicates = [];

            }
          }
        });
      }
    });
  }

  onClickHistory(index) {
    let history = this.searchHistory[index];

    this.clearFullTextSearchText();
    this.onFullTextSearch_clickFromHistory(history);
  }

  convertPrefixURItoURL(prefixURI) {
    let data;

    data = prefixURI.replace('<', '');
    data = data.replace('>', '');
    return data;
  }

  resetFilter() {
    this.filterSubject = true;
    this.filterPredicate = true;
    this.filterObject = true;
    this.includedUri = false;
    this.clearSearchSpecContent();
    this.clearResultTable();
    this.fullTextSearchText = '';
    this.clearSearchHistory();
  }

  onChangeTextSearchText(fullTextSearchText) {
    this.fullTextSearchText = fullTextSearchText;
    this.clearSearchSpecContent();
    this.clearResultTable();
    this.currentTriples.count = 0;
    this.currentTriples.results = [];
    this.currentTriples.matched_count = 0;
  }

  getPageRange(paging_items, num_of_pages, current_page) {
    let returnPagingItems = [],
      rangeSetting = 15,
      num_of_item,
      startPage,
      endPage,
      i;

    if (paging_items !== undefined && paging_items.length > 0) {
      num_of_item = paging_items.length;

      if (current_page <= 0) {
        current_page = 1;
      }
      startPage = current_page;

      if ((startPage + rangeSetting) > num_of_pages) {
        startPage = num_of_pages - rangeSetting;
      }

      if (startPage > 1) {
        this.hasInvisiblePreviousPagination = true;
      } else if (startPage === 1) {
        this.hasInvisiblePreviousPagination = false;
      } else if (startPage < 1) {
        this.hasInvisiblePreviousPagination = false;
      }

      endPage = startPage + rangeSetting;
      if (endPage > num_of_pages) {
        endPage = num_of_pages;
      }

      if (endPage !== num_of_pages) {
        this.hasInvisibleNextPagination = true;
      } else {
        this.hasInvisibleNextPagination = false;
      }

      for (i = 0; i < num_of_item; i++) {
        if ((i + 1) >= startPage && (i) < endPage) {
          returnPagingItems.push(paging_items[i]);
        }
      };
    } else {
      this.hasInvisiblePreviousPagination = false;
      this.hasInvisibleNextPagination = false;
    }
    return returnPagingItems;
  }

  processSearchFromHistory(searchHistory) {
    let currentPage = 1,
      solrSearchParameters = this.prepareSolrCallParameters(
          searchHistory.query,
          currentPage,
          searchHistory.isSearchAgaintsPredicate,
          searchHistory.resourceTypeFilters
      ),
      tripleObjects,
      self = this;

    this.searchOnSolr(solrSearchParameters, function (solrDocs) {
      solrDocs.query = searchHistory.query;
      tripleObjects = self.convertSolrDocsToTripleObjects(solrDocs);
      self.processFilterResourceType(tripleObjects, solrDocs, searchHistory.resourceTypeFilters,
        function (modifiedTripleObjects, modifiedSolrDocs, resourceTypeFilters) {
          self.displaySearchResult(
            searchHistory,
            modifiedSolrDocs,
            modifiedTripleObjects,
            currentPage
          );
          self.searchSpecContent =
            self.buildSearchSpecHtml(searchHistory, searchHistory.resourceTypeFilters);
          self.hiddenFullTextSearchText = self.fullTextSearchText;
          self.fullTextSearchText = '';
        }
      );
    });

    this.filterSubject = searchHistory.filterSubject;
    this.filterPredicate = searchHistory.filterPredicate;
    this.filterObject = searchHistory.filterObject;
    this.fullTextSearchText = searchHistory.queryText;
  }

  onFullTextSearch_clickFromHistory(searchHistory) {
    this.processSearchFromHistory(searchHistory);
    this.filterSubject = searchHistory.spo.filterSubject;
    this.filterPredicate = searchHistory.spo.filterPredicate;
    this.filterObject = searchHistory.spo.filterObject;
    this.includedUri = searchHistory.spo.includedUri;
    this.fullTextSearchText = searchHistory.search_term;
  }

  createPaginationItems(numOfPages) {
    let paging_items = [],
      i,
      paging_item;

    for (i = 0; i < numOfPages; i++) {
      paging_item = {page_num: i + 1};
      paging_items.push(paging_item);
    };
    return paging_items;
  }

  processSearchFromPaging(searchHistory, currentPage) {
    let solrSearchParameters = this.prepareSolrCallParameters(
                searchHistory.query,
                currentPage,
                searchHistory.isSearchAgaintsPredicate,
                searchHistory.resourceTypeFilters
            ),
      self = this,
      tripleObjects;

    this.searchOnSolr(solrSearchParameters, function (solrDocs) {
      solrDocs.query = searchHistory.query;
      tripleObjects = self.convertSolrDocsToTripleObjects(solrDocs);
      self.processFilterResourceType(
        tripleObjects,
        solrDocs,
        searchHistory.resourceTypeFilters,
        function (modifiedTripleObjects, modifiedSolrDocs, resourceTypeFilters) {
          self.displaySearchResult(
              searchHistory,
              modifiedSolrDocs,
              modifiedTripleObjects,
              currentPage
          );
        });
    });
  }

  clearFullTextSearchText() {
    this.fullTextSearchText = '';
  }

  clearSearchSpecContent() {
    this.searchSpecContent = '';
  }

  clearSearchHistory() {
    this.searchHistory = [];
  }

  clearResultTable() {
    this.currentTriples.count = 0;
    this.currentTriples.results = [];
  }

  onClearSearchHistory() {
    this.clearSearchHistory();
  }

  removeHistoryItem(history) {
    let i;

    for (i = this.searchHistory.length - 1; i >= 0; i--) {
      if (this.searchHistory[i].id === history.id) {
        this.searchHistory.splice(i, 1);
        break;
      }
    };
  }

}

SearchController.$inject = ['$q',
                            '$rootScope',
                            '$scope',
                            '$cookies',
                            '$location',
                            '$filter',
                            '$sce',
                            '$uibModal',
                            'apiManagerService',
                            'notificationManagerService',
                            'sessionManagerService',
                            '$window',
                            '$log'
                           ];
