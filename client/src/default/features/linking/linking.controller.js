import ModalDialogController from './modalDialog.controller';
import jqueryDndFuncs from './linking.js';

class LinkingController {
  constructor($rootScope,
              $scope,
              $location,
              $uibModal,
              apiManagerService,
              notificationManagerService,
              sessionManagerService) {
    let self = this;

    this.r = $rootScope;
    this.scope = $scope;
    this.modal = $uibModal;
    this.sessionManagerService = sessionManagerService;
    this.domain = this.sessionManagerService.get('org').domain +
      '/' + this.sessionManagerService.get('profile').email + '/default';
    this.defaultDomain = this.domain;
    this.datasetSearchScope = this.domain;
    this.location = $location;
    this.jqueryDndFuncs = jqueryDndFuncs;
    this.apiManagerService = apiManagerService;
    this.notifier = notificationManagerService;
    this.workspace_subject = {items: [], keys: []};
    this.workspace_predicate = {items: [], keys: []};
    this.workspace_object = {items: [], keys: []};
    this.prefixes = [
      {prefix: 'rdf', uri: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#'},
      {prefix: 'rdfs', uri: 'http://www.w3.org/2000/01/rdf-schema#'},
      {prefix: 'dc', uri: 'http://purl.org/dc/elements/1.1/'}
    ];
    this.fuseki_port = '';
    this.fuseki_host = '';
    this.fuseki_tdb = '';
    this.fuseki_update_url = 'http://' + this.fuseki_host + ':' +
      this.fuseki_port + '/' + this.fuseki_tdb + '/update';
    this.solr_port = '';
    this.solr_host = '';
    this.solr_core = '';
    this.solr_update_url = 'http://' + this.solr_host +
      ':' + this.solr_port +
      '/solr/' + this.solr_core + '/update?commit=true&stream.body=';
    this.editor = {rows: []};
    this.libs = [];
    this.rdfLib_baseURI = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
    this.rdfLib = {
      id: 'rdfLib',
      prefix: 'rdf',
      namespace_uri: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
      name: 'RDF',
      version: '1.1',
      resources: [{
        resource_name: 'rdf:type',
        description: 'rdf:type is an instance of rdf:Property that ' +
                     'is used to state that a resource is an instance of a class.',
        resource_uri: this.rdfLib_baseURI + 'type',
        resource_type: 'predicate lib',
        resource_color: 'default'
      }]
    };
    this.rdfsLib_baseURI = 'http://www.w3.org/2000/01/rdf-schema#';
    this.rdfsLib = {
      id: 'rdfsLib',
      prefix: 'rdfs',
      namespace_uri: this.rdfsLib_baseURI,
      name: 'RDFS',
      version: '1.1',
      resources: [{
        resource_name: 'rdfs:subClassOf',
        description: 'The property rdfs:subClassOf is an instance of rdf:Property that ' +
                     'is used to state that all the instances of one class are instances of another.',
        resource_uri: this.rdfsLib_baseURI + 'subClassOf',
        resource_type: 'predicate lib',
        resource_color: 'default'
      }, {
        resource_name: 'rdfs:subPropertyOf',
        description: 'The property rdfs:subPropertyOf is an instance of rdf:Property that is ' +
                     'used to state that all resources related by one property are also related by another.',
        resource_uri: this.rdfsLib_baseURI + 'subPropertyOf',
        resource_type: 'predicate lib',
        resource_color: 'default'
      }, {
        resource_name: 'rdfs:domain',
        description: 'rfs:domain is an instance of rdf:Property that is used to state ' +
                     'that any resource that has a given property is an instance of one or more classes.',
        resource_uri: this.rdfsLib_baseURI + 'domain',
        resource_type: 'predicate lib',
        resource_color: 'default'
      }]
    };
    this.owlLib_baseURI = 'http://www.w3.org/2002/07/owl#';
    this.owlLib = {
      id: 'owlLib',
      prefix: 'owl',
      namespace_uri: this.owlLib_baseURI,
      name: 'OWL',
      version: '1.1',
      resources: [{
        resource_name: 'owl:sameAs',
        description: 'The built-in OWL property owl:sameAs links an individual to an individual. ' +
                     'Such an owl:sameAs statement indicates that two URI references actually refer ' +
                     'to the same thing: the individuals have the same "identity".',
        resource_uri: this.owlLib_baseURI + 'sameAs',
        resource_type: 'predicate lib',
        resource_color: 'default'
      }]
    };
    this.oslcRequirementsManagementLib_baseURI = 'http://open-services.net/ns/rm#';
    this.oslcRequirementsManagementLib = {
      id: 'oslcRequirementsManagementLib',
      name: 'OSLC RM',
      version: '2.0',
      prefix: 'oslc_rm',
      resources: [{
        resource_name: 'oslc_rm:Requirement',
        description: 'OSLC Requirement',
        resource_uri: this.oslcRequirementsManagementLib_baseURI + 'Requirement',
        resource_type: 'predicate lib',
        resource_color: 'default'
      }, {
        resource_name: 'oslc_rm:elaboratedBy',
        description: 'The subject is elaborated by the object. For example, ' +
                     'a collection of user requirements elaborates a business need, ' +
                     'or a model elaborates a collection of system requirements.',
        resource_uri: this.oslcRequirementsManagementLib_baseURI + 'elaboratedBy',
        resource_type: 'predicate lib',
        resource_color: 'default'
      }, {
        resource_name: 'oslc_rm:elaborates',
        description: 'The object is elaborated by the subject.',
        resource_uri: this.oslcRequirementsManagementLib_baseURI + 'elaborates',
        resource_type: 'predicate lib',
        resource_color: 'default'
      }, {
        resource_name: 'oslc_rm:specifiedBy',
        description: 'The subject is specified by the object. For example, ' +
                     'a model element might make a requirement collection more precise.',
        resource_uri: this.oslcRequirementsManagementLib_baseURI + 'specifiedBy',
        resource_type: 'predicate lib',
        resource_color: 'default'
      }, {
        resource_name: 'oslc_rm:specifies',
        description: 'The object is specified by the subject.',
        resource_uri: this.oslcRequirementsManagementLib_baseURI + 'specifies',
        resource_type: 'predicate lib',
        resource_color: 'default'
      }, {
        resource_name: 'oslc_rm:affectedBy',
        description: 'The subject is affected by the object, for example, a defect or issue.',
        resource_uri: this.oslcRequirementsManagementLib_baseURI + 'affectedBy',
        resource_type: 'predicate lib',
        resource_color: 'default'
      }, {
        resource_name: 'oslc_rm:trackedBy',
        description: 'Resource, such as a change request, which manages this requirement collection.',
        resource_uri: this.oslcRequirementsManagementLib_baseURI + 'trackedBy',
        resource_type: 'predicate lib',
        resource_color: 'default'
      }, {
        resource_name: 'oslc_rm:implementedBy',
        description: 'Resource, such as a change request, which implements this requirement collection.',
        resource_uri: this.oslcRequirementsManagementLib_baseURI + 'implementedBy',
        resource_type: 'predicate lib',
        resource_color: 'default'
      }, {
        resource_name: 'oslc_rm:validatedBy',
        description: 'Resource, such as a test plan, which validates this requirement collection.',
        resource_uri: this.oslcRequirementsManagementLib_baseURI + 'validatedBy',
        resource_type: 'predicate lib',
        resource_color: 'default'
      }, {
        resource_name: 'oslc_rm:satisfiedBy',
        description: 'The subject is satisfied by the object. For example, ' +
                     'a collection of user requirements is satisfied by a ' +
                     'requirement collection of system requirements.',
        resource_uri: this.oslcRequirementsManagementLib_baseURI + 'satisfiedBy',
        resource_type: 'predicate lib',
        resource_color: 'default'
      }, {
        resource_name: 'oslc_rm:satisfies',
        description: 'The object is satisfied by the subject.',
        resource_uri: this.oslcRequirementsManagementLib_baseURI + 'satisfies'
      }, {
        resource_name: 'oslc_rm:decomposedBy',
        description: 'The subject is decomposed by the object. For example, ' +
                     'a collection of business requirements is decomposed by a collection of user requirements.',
        resource_uri: this.oslcRequirementsManagementLib_baseURI + 'decomposedBy',
        resource_type: 'predicate lib',
        resource_color: 'default'
      }, {
        resource_name: 'oslc_rm:decomposes',
        description: 'The object is decomposed by the subject.',
        resource_uri: this.oslcRequirementsManagementLib_baseURI + 'decomposes',
        resource_type: 'predicate lib',
        resource_color: 'default'
      }, {
        resource_name: 'oslc_rm:constrainedBy',
        description: 'The subject is constrained by the object. For example, ' +
                     'a requirement collection is constrained by a requirement collection.',
        resource_uri: this.oslcRequirementsManagementLib_baseURI + 'constrainedBy',
        resource_type: 'predicate lib',
        resource_color: 'default'
      }, {
        resource_name: 'oslc_rm:constrains',
        description: 'The object is constrained by the subject.',
        resource_uri: this.oslcRequirementsManagementLib_baseURI + 'constrains',
        resource_type: 'predicate lib',
        resource_color: 'default'
      }]
    };
    this.libs.push(this.rdfLib);
    this.libs.push(this.rdfsLib);
    this.libs.push(this.owlLib);
    this.libs.push(this.oslcRequirementsManagementLib);

    this.scope.$on('addSubjectToWorkspace', function (event, args) {
      let resource = {};

      console.log('broadcast received on "addSubjectWorkspace"');
      resource.resource_name = args.triple.subject_name;
      resource.resource_uri = args.triple.subject_uri;
      resource.resource_type = 'S';
      resource.resource_color = 'warning';
      self.workspace_subject.items.push(resource);
      self.workspace_subject.keys[resource.resource_uri] = resource;
      self.jqueryDndFuncs.setupDnD();
    });

    this.scope.$on('removeSubjectFromWorkspace', function (event, args) {
      let id, i;

      console.log('broadcast received on "removeSubjectWorkspace"');
      for (i = 0; i < self.workspace_subject.items.length; i++) {
        id = self.workspace_subject.items[i].resource_uri;
        if (id === args.triple.subject_uri) {
          self.workspace_subject.items.splice(i, 1);
          delete self.workspace_subject.keys[id];
          break;
        }
      };
    });

    this.scope.$on('addPredicateToWorkspace', function (event, args) {
      let resource = {};

      console.log('broadcast received on "addPredicateToWorkspace"');
      resource.resource_name = args.triple.predicate_name;
      resource.resource_uri = args.triple.predicate_uri;
      resource.resource_type = 'P';
      resource.resource_color = 'danger';
      self.workspace_predicate.items.push(resource);
      self.workspace_predicate.keys[resource.resource_uri] = resource;
      self.jqueryDndFuncs.setupDnD();
    });

    this.scope.$on('removePredicateFromWorkspace', function (event, args) {
      let id, i;

      console.log('broadcast received on "removePredicateFromWorkspace"');
      for (i = 0; i < self.workspace_predicate.items.length; i++) {
        id = self.workspace_predicate.items[i].resource_uri;
        if (id === args.triple.predicate_uri) {
          self.workspace_predicate.items.splice(i, 1);
          delete self.workspace_predicate.keys[id];
          break;
        }
      };
    });

    this.scope.$on('addObjectToWorkspace', function (event, args) {
      let resource = {};

      console.log('broadcast received on "addObjectToWorkspace"');
      resource.resource_name = args.triple.object_name;
      resource.resource_uri = args.triple.object_uri;
      resource.resource_type = 'O';
      resource.resource_color = 'info';
      self.workspace_object.items.push(resource);
      self.workspace_object.keys[resource.resource_uri] = resource;
      self.jqueryDndFuncs.setupDnD();
    });

    this.scope.$on('removeObjectFromWorkspace', function (event, args) {
      let id, i;

      console.log('broadcast received on "removeObjectFromWorkspace"');
      for (i = 0; i < self.workspace_object.items.length; i++) {
        id = self.workspace_object.items[i].resource_uri;
        if (id === args.triple.object_uri) {
          self.workspace_object.items.splice(i, 1);
          delete self.workspace_object.keys[id];
          break;
        }
      };
    });

    this.addRow();

    setTimeout(function () {
      self.setupDnD();
    }, 2000);

  }

  broadcast() {
    this.r.$broadcast('refreshUI', {});
  }

  openModalDialog(content, callback) {
    this.r.$broadcast('closeModalDialog', {});
    this.modal.open({
      animation: true,
      template: require('./modalDialog.html'),
      controller: ModalDialogController,
      controllerAs: 'dialog',
      backdrop: 'static',
      size: '',
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

  setupDnD() {
    let i;

    for (i = 0; i < this.libs.length; i++) {
      this.jqueryDndFuncs.setupDnDWithName(this.libs[i].id);
    };

    this.jqueryDndFuncs.setupDnDWithName('resource_type');
  }

  countWorkspaceItems() {
    return this.workspace_subject.items.length +
           this.workspace_predicate.items.length +
           this.workspace_object.items.length;
  }

  clearWorkspace() {
    this.workspace_subject.items = [];
    this.workspace_subject.keys = [];
    this.workspace_predicate.items = [];
    this.workspace_predicate.keys = [];
    this.workspace_object.items = [];
    this.workspace_object.keys = [];
    this.removeAllRows();
    this.r.$broadcast('clearWorkspace', {});
  }

  removeItem(type, resource_uri) {
    let i, id, dialogSetting;

    if (type.toUpperCase() === 'SUBJECT') {
      for (i = 0; i < this.workspace_subject.items.length; i++) {
        id = this.workspace_subject.items[i].resource_uri;
        if (id === resource_uri) {
          this.workspace_subject.items.splice(i, 1);
          delete this.workspace_subject.keys[id];
          this.r.$broadcast('lars', {resource_uri: resource_uri});
          break;
        }
      };
    } else if (type.toUpperCase() === 'PREDICATE') {
      for (i = 0; i < this.workspace_predicate.items.length; i++) {
        id = this.workspace_predicate.items[i].resource_uri;
        if (id === resource_uri) {
          this.workspace_predicate.items.splice(i, 1);
          delete this.workspace_predicate.keys[id];
          this.r.$broadcast('larp', {resource_uri: resource_uri});
          break;
        }
      };
    } else if (type.toUpperCase() === 'OBJECT') {
      for (i = 0; i < this.workspace_object.items.length; i++) {
        id = this.workspace_object.items[i].resource_uri;
        if (id === resource_uri) {
          this.workspace_object.items.splice(i, 1);
          delete this.workspace_object.keys[id];
          this.r.$broadcast('laro', {resource_uri: resource_uri});
          break;
        }
      };
    } else {
      dialogSetting = {
        showCLOSE: true,
        title: 'Error Message',
        body: 'Type input is not valid'
      };
      console.log(dialogSetting);
      // KLD_SERVICE.openModalDialog( dialogSetting, function(status){});
    }
  }

  addRow() {
    let editorRow = {
      subjectReady: false,
      subjectCol: {
        resource_name: {},
        resource_uri: {}
      },
      predicateReady: false,
      predicateCol: {
        resource_name: {},
        resource_uri: {}
      },
      objectReady: false,
      objectCol: {
        resource_name: {},
        resource_uri: {}
      }
    };

    this.editor.rows.push(editorRow);
    this.jqueryDndFuncs.makeDroppableOnEditor(this.editor.rows.length - 1, 'subject');
    this.jqueryDndFuncs.makeDroppableOnEditor(this.editor.rows.length - 1, 'predicate');
    this.jqueryDndFuncs.makeDroppableOnEditor(this.editor.rows.length - 1, 'object');
  }

  removeSpecificRow(index) {
    this.editor.rows.splice(index, 1);
  }

  removeRow() {
    console.log('removeRow');
    if (this.editor.rows.length === 1) {
      return;
    }
    this.editor.rows.splice(this.editor.rows.length - 1, 1);
  }

  removeAllRows() {
    let i;

    console.log('removeAllRows');
    for (i = this.editor.rows.length - 1; i >= 0; i--) {
      this.editor.rows.splice(i, 1);
    };
  }

  addTripleIntoEditor(resource, row, colType) {
    let editorRow = this.editor.rows[row],
      dialogSetting;

    console.log('addTripleIntoEditor');
    if (editorRow === undefined) {
      dialogSetting = {
        showCLOSE: true,
        title: 'Error Message',
        body: 'Not found editorRow object'
      };
      this.openModalDialog(dialogSetting, function (status) {});
      return;
    }

    if (colType === 'subject') {
      editorRow.subjectReady = true;
      editorRow.subjectCol.resource_name = resource.resource_name;
      editorRow.subjectCol.resource_uri = resource.resource_uri;

    } else if (colType === 'predicate') {
      editorRow.predicateReady = true;
      editorRow.predicateCol.resource_name = resource.resource_name;
      editorRow.predicateCol.resource_uri = resource.resource_uri;

    } else if (colType === 'object') {
      editorRow.objectReady = true;
      editorRow.objectCol.resource_name = resource.resource_name;
      editorRow.objectCol.resource_uri = resource.resource_uri;

    } else {
      dialogSetting = {
        showCLOSE: true,
        title: 'Error Message',
        body: 'Not found colType=' + colType
      };
      console.log(dialogSetting);
      this.openModalDialog(dialogSetting, function (status) {});
      return;
    }
  }

  clearTable() {
    console.log('clearTable');
    this.removeAllRows();
  }

  saveAllLinks() {
    let self = this, messages = '<ol>', dialogSetting;

    console.log('saveAllLinks this.editor.rows.length = ', this.editor.rows.length);
    this.editor.rows.forEach(function (row, index) {
      if (row.subjectReady && row.predicateReady && row.objectReady) {
        self.saveLink(index, row, function (message) {
          messages += '<li>' + message + '</li>';
          if (self.editor.rows.length === index + 1) {
            dialogSetting = {
              showCLOSE: true,
              title: 'Message',
              body: messages + '</ol>'
            };
            self.openModalDialog(dialogSetting);
            self.broadcast();
          }
        });
      } else {
        self.removeSpecificRow(index);
      }
    });
  }

  saveLink(index, row, callback) {
    let self = this,
      dialogSetting,
      stmts,
      stmt1,
      stmt2,
      updateStatementWithoutGraphName,
      updateStatement,
      graphName,
      criticalProcessIsCompeleted;

    if (row.subjectReady === false) {
      dialogSetting = {
        showCLOSE: true,
        title: 'Error Message',
        body: 'Subject row ' + (index + 1) + ' cannot be empty'
      };
      this.openModalDialog(dialogSetting, function (status) {});
      return;

    } else if (row.predicateReady === false) {
      dialogSetting = {
        showCLOSE: true,
        title: 'Error Message',
        body: 'Predicate row ' + (index + 1) + ' cannot be empty'
      };
      this.openModalDialog(dialogSetting, function (status) {});
      return;

    } else if (row.objectReady === false) {
      dialogSetting = {
        showCLOSE: true,
        title: 'Error Message',
        body: 'Object row ' + (index + 1) + ' cannot be empty'
      };
      this.openModalDialog(dialogSetting, function (status) {});
      return;
    }

    stmts = [];
    stmt1 = {
      operation: 'delete',
      subject_uri: '<' + row.subjectCol.resource_uri + '>',
      predicate_uri: '<' + row.predicateCol.resource_uri + '>',
      object_uri: '<' + row.objectCol.resource_uri + '>'
    };
    stmts.push(stmt1);
    stmt2 = {
      operation: 'insert',
      subject_uri: '<' + row.subjectCol.resource_uri + '>',
      predicate_uri: '<' + row.predicateCol.resource_uri + '>',
      object_uri: '<' + row.objectCol.resource_uri + '>'
    };
    stmts.push(stmt2);
    graphName = this.datasetSearchScope;
    criticalProcessIsCompeleted = 0;
    this.sendSolrDeletion(row, function (data) {
      if (!data.success) {
        dialogSetting = {
          showCLOSE: true,
          title: 'Fatal Error Message',
          body: 'Found err: ' + data.message
        };
        console.log(dialogSetting);
        self.openModalDialog(dialogSetting, function (status) {});
      } else {
        criticalProcessIsCompeleted++;
        updateStatement = self.createSparqlUpdateStmt(stmts, graphName);
        updateStatementWithoutGraphName = self.createSparqlUpdateStmt(stmts);
        self.sendSparqlUpdate(updateStatementWithoutGraphName, updateStatement, function (data) {
          if (data.success) {
            criticalProcessIsCompeleted++;
            dialogSetting = {
              showCLOSE: true,
              title: 'Message',
              body: row.subjectCol.resource_name + ' > ' +
                    row.predicateCol.resource_name + ' > ' +
                    row.objectCol.resource_name + ' has been saved! <br>'
            };
            if (callback) {
              callback(dialogSetting.body);
              this.broadcast();
            } else {
              self.openModalDialog(dialogSetting);
              self.broadcast();
            }
          } else {
            dialogSetting = {
              showCLOSE: true,
              title: 'Fatal Error Message',
              body: 'Found err: ' + data.message
            };
            self.openModalDialog(dialogSetting, function (status) {});
          }
        });
      }
    });
  }

  createSparqlUpdateStmt(sparql_stmts, graphName) {
    let line = '\n', stmt = '', i, dialogSetting;

    console.log('createSparqlUpdateStmt() sparql_stmts = ', sparql_stmts);
    console.log('createSparqlUpdateStmt() graphName = ', graphName);
    for (i = 0; i < this.prefixes.length; i++) {
      stmt += 'prefix ' + this.prefixes[i].prefix + ': <' + this.prefixes[i].uri + '> ' + line;
    };

    for (i = 0; i < sparql_stmts.length; i++) {
      stmt += line + line;
      if (sparql_stmts[i].operation.toUpperCase() === 'delete'.toUpperCase()) {

        if (graphName !== undefined) {
          stmt += 'delete data { GRAPH <' + graphName + '> { ' + line +
            '  ' + sparql_stmts[i].subject_uri + line +
            '  ' + sparql_stmts[i].predicate_uri + line +
            '  ' + sparql_stmts[i].object_uri + line + ' } };';
        } else {
          stmt += 'delete data { ' + line +
            '  ' + sparql_stmts[i].subject_uri + line +
            '  ' + sparql_stmts[i].predicate_uri + line +
            '  ' + sparql_stmts[i].object_uri + line + ' };';
        }
      } else if (sparql_stmts[i].operation.toUpperCase() === 'insert'.toUpperCase()) {
        if (graphName !== undefined) {
          stmt += 'insert data { GRAPH <' + graphName + '> { ' + line +
            '  ' + sparql_stmts[i].subject_uri + line +
            '  ' + sparql_stmts[i].predicate_uri + line +
            '  ' + sparql_stmts[i].object_uri + line +
            '} } ;';
        } else {
          stmt += 'insert data { ' + line +
            '  ' + sparql_stmts[i].subject_uri + line +
            '  ' + sparql_stmts[i].predicate_uri + line +
            '  ' + sparql_stmts[i].object_uri + line +
            '} ;';
        }
      } else {
        dialogSetting = {
          showCLOSE: true,
          title: 'Error Message',
          body: 'Parse SPARQL update statement error'
        };
        console.log(dialogSetting);
      }
    };
    stmt += line + line;
    console.log('createSparqlUpdateStmt() stmt = ', stmt);
    return stmt;
  }

  sendSparqlUpdate(updateStatementWithoutGraphName, updateStatement, callback) {
    this.apiManagerService.fusekiApiPostSparqlUpdate(updateStatementWithoutGraphName, updateStatement, function (resp) {
      console.log(resp);
      if (resp.success) {
        callback(resp);
      } else {
        self.notifier.error({message: 'Cannot connect to FUSEKI'});
      }
    });
  }

  sendSolrDeletion(row, callback) {
    let subject_resource_uri = row.subjectCol.resource_uri.replace(/:/g, '\\:'),
      predicate_resource_name = row.predicateCol.resource_name.replace(/:/g, '_'),
      object_resource_uri = row.objectCol.resource_uri.replace(/:/g, '\\:'),
      deletion_string = '<delete><query>(uri:' + subject_resource_uri +
                        ') AND (p_' + predicate_resource_name + ':' +
                        object_resource_uri + ')</query></delete>',
      deletionString = escape(deletion_string);

    console.log('sendSolrDeletion deletionString = ', deletionString);

    this.apiManagerService.solrApiPostDelete(deletionString, function (resp) {
      console.log(resp);
      if (resp.success) {
        callback(resp);
      } else {
        self.notifier.error({message: 'Cannot connect to Solr'});
      }
    });
  }
}

LinkingController.$inject = ['$rootScope',
                             '$scope',
                             '$location',
                             '$uibModal',
                             'apiManagerService',
                             'notificationManagerService',
                             'sessionManagerService'
                            ];

export default LinkingController;
