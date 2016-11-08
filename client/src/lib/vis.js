
export default class Visualizer {

  constructor(apiManagerService, notificationManagerService) {
    this.apiManagerService = apiManagerService;
    this.notifier = notificationManagerService;
    console.log('Visualizer loaded');
  }

  buildVis(typeInstances, uri, callback) {
    let self = this,
      visJSON,
      graphVisData = {uri: uri, isObject: false, name: uri, size: 10, children: []};

    typeInstances.forEach(function (subject, index) {
      let childQueryStmt = self.buildAttrDetailStatement(subject.Resource.value),
        childVisData = {
          uri: subject.Resource.value,
          isObject: false,
          name: self.humanReadable(subject.Resource.value),
          size: 10,
          children: []
        };

      graphVisData.name = typeInstances.length + ' instances';
      graphVisData.children.push(childVisData);
      self.sparqlQueryWithoutProgress(childQueryStmt, function (visResources) {
        visJSON = JSON.parse(visResources);
        self.buildBlock(visJSON.results.bindings, function (processedAttrBlock) {
          childVisData.name += ' (' + processedAttrBlock.blocks.length + ')';
          processedAttrBlock.blocks.forEach(function (block) {
            let predicateVisData = {
              uri: block.predicateUri,
              isObject: false,
              name: self.humanReadable(block.predicateUri) + ' (' + block.objects.length + ')',
              size: processedAttrBlock.blocks.length,
              children: []
            };

            block.objects.forEach(function (object, objIndex) {
              predicateVisData.children.push({
                uri: object.uri,
                isObject: true,
                name: object.isUri ? self.humanReadable(object.uri) : object.uriWithoutDatatype,
                size: block.objects.length
              });
              if (objIndex === block.objects.length - 1) {
                childVisData.children.push(predicateVisData);
                if (index === typeInstances.length - 1) {
                  callback(graphVisData);
                }
              }
            });
          });
        });
      });
    });
  }

  buildBlock(resources, callback) {
    let self = this,
      attrBlock = {
        creationDate: new Date(),
        subject: {
          name: '',
          uri: ''
        },
        predicates: [],
        blocks: []
      };

    resources.forEach(function (obj, index) {
      attrBlock.subject.name = self.humanReadable(obj.subject.value);
      attrBlock.subject.uri = obj.subject.value;
      if (attrBlock.predicates[obj.predicate.value] === undefined) {
        attrBlock.predicates[obj.predicate.value] = {
          uri: obj.predicate.value,
          objects: []
        };
      }
      if (obj.object.type === 'uri') {
        attrBlock.predicates[obj.predicate.value].objects.push({
          name: self.humanReadable(obj.object.value),
          uri: obj.object.value,
          isUri: true
        });
      } else {
        attrBlock.predicates[obj.predicate.value].objects.push({
          name: self.humanReadable(obj.object.value),
          uri: obj.object.value + '^^<' + obj.object.datatype + '>',
          uriWithoutDatatype: obj.object.value,
          isUri: false
        });
      }

      if (index === resources.length - 1) {
        Object.keys(attrBlock.predicates).forEach(function (predicateKey) {
          attrBlock.blocks.push({
            predicateUri: predicateKey,
            objects: attrBlock.predicates[predicateKey].objects
          });
        });
        callback(attrBlock);
      }
    });
  }

  humanReadable(value) {
    let v;

    v = value.split('/').pop();
    v = v.replace(/\_/g, ' ');
    v = v.split('#').pop();
    return v;
  }

  buildAttrDetailStatement(uri) {
    return 'select * where {  BIND(<' + uri + '> AS ?subject) <' + uri + '> ?predicate ?object }';
  }

  sparqlQueryWithoutProgress(queryStmt, callback) {
    let self = this;

    this.apiManagerService.fusekiApiPostSparqlQueryWithoutProgress(
      {queryStatement: queryStmt, graph: 'http://example.com', format: 'json'}, function (resp) {
      if (resp.success) {
        if (callback) { callback(resp.returnData.resources); }
      } else {
        self.notifier.error({message: '<b>Performing SPARQL query on ' +
          self.window.clientId + '\'s dataset</b> <br>' + resp.message});
      }
    });
  }
}
