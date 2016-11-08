'use strict';

let jQuery = require('jquery');

(function (old) {
  jQuery.fn.attr = function () {
    if (arguments.length === 0) {
      let obj = {};

      if (this.length === 0) {
        return null;
      }

      jQuery.each(this[0].attributes, function () {
        if (this.specified) {
          obj[this.name] = this.value;
        }
      });
      return obj;
    }

    return old.apply(this, arguments);
  };
})(jQuery.fn.attr);

module.exports = (function () {

  function guid() {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000).toString(16)
        .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
      s4() + '-' + s4() + s4() + s4();
  }

  function createServiceNode() {
    return {
      title: 'untitled title',
      type: 'untitled type',
      nodeId: 'untitled nodeId',
      queryBase: ''
    };
  }

  function parseXmlNS(rdf, callback) {
    let returnResource = { xmlns: []},
      n1 = jQuery(rdf).filter('*'),
      ln1,
      xmlns;

    n1.each(function (index1, node1) {
      ln1 = jQuery(node1).attr();
      jQuery.each(ln1, function (key, val) {
        xmlns = {};
        xmlns.prefix = key.split(':').pop();
        xmlns.name = key;
        xmlns.value = val;
        returnResource.xmlns.push(xmlns);
      });
      callback(returnResource);
    });
  }

  function parseServiceProviders(rdf, callback) {
    let returnResource = { rdf: rdf, serviceProviders: []},
      n1 = jQuery(rdf).find('oslc\\:serviceProvider'),
      numOfServiceProviders = n1.length,
      serviceProvider,
      resource,
      n6,
      numOfServices,
      nodeId,
      isNodeIdDetected,
      n71,
      n711,
      n711QueryCapNodeId,
      serviceNode,
      n7111,
      n7112,
      serviceNodeResource,
      n72,
      n72NodeId,
      n721,
      n722;

    n1.each(function (index1, node1) {
      serviceProvider = {};
      serviceProvider.id = guid();
      serviceProvider.rdf = node1;
      serviceProvider.uri = '';
      serviceProvider.Name = '';
      serviceProvider.serviceNodeXmlNS = [];
      serviceProvider.DescriptionRDF = '';
      serviceProvider.Description = '';
      serviceProvider.Title = '';
      serviceProvider.RDFType = '';
      serviceProvider.Created = '';
      serviceProvider.numOfQueryCapability = 0;
      serviceProvider.numOfCreationFactory = 0;
      serviceProvider.ServiceNodes = [];

      resource = jQuery(node1).attr('rdf:resource');

      serviceProvider.uri = resource;
      serviceProvider.Name = resource.split('/').pop();

      jQuery(rdf).find('rdf\\:Description[rdf\\:about="' + resource + '"]').each(function (indexDescRdf, nodeDescRdf) {
        serviceProvider.DescriptionRDF = (new XMLSerializer()).serializeToString(nodeDescRdf);
      });

      jQuery(rdf).find('rdf\\:Description[rdf\\:about="' + resource + '"] > dcterms\\:title')
      .each(function (index2, node2) {
        serviceProvider.Title = node2.innerText;
        serviceProvider.Title = serviceProvider.Title.replace(/\ /g, '');
        serviceProvider.Title = serviceProvider.Title.replace(/\-/g, '');
        if (serviceProvider.Title === 'SubversionFiles') {
          return;
        }

        jQuery(rdf).find('rdf\\:Description[rdf\\:about="' + resource + '"] > dcterms\\:description ')
        .each(function (index3, node3) {
          serviceProvider.Description = node3.innerText;
          jQuery(rdf).find('rdf\\:Description[rdf\\:about="' + resource + '"] > rdf\\:type ')
          .each(function (index4, node4) {
            // console.log('index1: indexDescRdf index4 ' + index4);
            serviceProvider.RDFType = jQuery(node4).attr('rdf:resource');

            jQuery(rdf).find('rdf\\:Description[rdf\\:about="' + resource + '"] > dcterms\\:created ')
            .each(function (index5, node5) {
              serviceProvider.Created = node5.innerText;

              n6 = jQuery(rdf).find('rdf\\:Description[rdf\\:about="' + resource + '"] > oslc\\:service');
              numOfServices = n6.length;
              // console.log('numOfServices: ' + numOfServices);
              n6.each(function (index6, node6) {
                /*
                  <rdf:Description rdf:nodeID="A92">
                    <oslc:queryCapability rdf:nodeID="A93"/>
                    <oslc:creationFactory rdf:nodeID="A94"/>
                    <oslc:domain rdf:resource="http://mathworks.com/simulink/r2013a/line/rdf#"/>
                    <rdf:type rdf:resource="http://open-services.net/ns/core#Service"/>
                  </rdf:Description>
                */
                nodeId = jQuery(node6).attr('rdf:nodeID'); // A92
                isNodeIdDetected = nodeId !== undefined;
                if (isNodeIdDetected) {
                  /*
                  <rdf:Description rdf:nodeID="A93">
                    <oslc:resourceType rdf:resource="http://www.mathworks.com/products/simulink/Line"/>
                    <oslc:queryBase rdf:resource="http://localhost:9080/oslc4jsimulink/services/model11AfterRT4/lines"/>
                    <oslc:usage rdf:resource="http://open-services.net/ns/core#default"/>
                    <oslc:resourceShape
                        rdf:resource="http://localhost:9080/oslc4jsimulink/services/resourceShapes/line"/>
                    <dcterms:title rdf:parseType="Literal">Simulink Line Query Capability</dcterms:title>
                    <oslc:label>Simulink Line Catalog Query</oslc:label>
                    <rdf:type rdf:resource="http://open-services.net/ns/core#QueryCapability"/>
                  </rdf:Description>

                  <rdf:Description rdf:nodeID="A94">
                    <oslc:resourceShape
                        rdf:resource="http://localhost:9080/oslc4jsimulink/services/resourceShapes/line"/>
                    <oslc:resourceType rdf:resource="http://www.mathworks.com/products/simulink/Line"/>
                    <oslc:usage rdf:resource="http://open-services.net/ns/core#default"/>
                    <dcterms:title rdf:parseType="Literal">Simulink Line Creation Factory</dcterms:title>
                    <oslc:creation rdf:resource="http://localhost:9080/oslc4jsimulink/services/model11AfterRT4/lines"/>
                    <oslc:label>Simulink Line Creation</oslc:label>
                    <rdf:type rdf:resource="http://open-services.net/ns/core#CreationFactory"/>
                  </rdf:Description>
                   */
                  n71 = jQuery(rdf).find('rdf\\:Description[rdf\\:nodeID="' + nodeId + '"]');
                  n71.each(function (index71, node71) {
                    n711 = jQuery(rdf)
                      .find('rdf\\:Description[rdf\\:nodeID="' + nodeId + '"] > oslc\\:queryCapability');
                    n711.each(function (index711, node711) {
                      n711QueryCapNodeId = jQuery(node711).attr('rdf:nodeID');  // A93
                      serviceNode = createServiceNode();
                      serviceNode.id = guid();
                      n7111 = jQuery(rdf)
                        .find('rdf\\:Description[rdf\\:nodeID="' + n711QueryCapNodeId + '"] > dcterms\\:title');
                      n7111.each(function (index7111, node7111) {
                        serviceNode.nodeId = n711QueryCapNodeId;
                        serviceNode.title = node7111.innerText;
                        serviceNode.title = serviceNode.title.replace(/\ /g, '');
                        serviceNode.title = serviceNode.title.replace(/\-/g, '');
                        serviceNode.type = 'queryCapability';
                      });
                      n7112 = jQuery(rdf)
                        .find('rdf\\:Description[rdf\\:nodeID="' + n711QueryCapNodeId + '"] > oslc\\:queryBase');
                      n7112.each(function (index7112, node7112) {
                        serviceNode.queryBase = jQuery(node7112).attr('rdf:resource');
                      });
                      serviceProvider.ServiceNodes.push(serviceNode);
                      serviceProvider.numOfQueryCapability++;
                    });
                  });

                } else {

                  console.log('Direct resoruce uri -- index1: ' + index1 + ' nodeID index6 ' + nodeId);
                  serviceNodeResource = jQuery(node6).attr('rdf:resource');
                  n72 = jQuery(rdf)
                    .find('rdf\\:Description[rdf\\:about="' + serviceNodeResource + '"] > oslc\\:queryCapability');
                  n72.each(function (index72, node72) {
                    n72NodeId = jQuery(node72).attr('rdf:nodeID');
                    serviceNode = createServiceNode();
                    serviceNode.nodeId = n72NodeId;

                    n721 = jQuery(rdf).find('rdf\\:Description[rdf\\:nodeID="' + n72NodeId + '"] > dcterms\\:title');
                    n721.each(function (index721, node721) {
                      serviceNode.title = node721.innerText;
                      serviceNode.title = serviceNode.title.replace(/\ /g, '');
                      serviceNode.title = serviceNode.title.replace(/\-/g, '');
                      serviceNode.type = 'queryCapability';
                    });

                    n722 = jQuery(rdf).find('rdf\\:Description[rdf\\:nodeID="' + n72NodeId + '"] > oslc\\:queryBase');
                    n722.each(function (index722, node722) {
                      serviceNode.queryBase = jQuery(node722).attr('rdf:resource');
                    });

                    serviceProvider.ServiceNodes.push(serviceNode);
                    serviceProvider.numOfQueryCapability++;
                  });
                }

                if (index6 === (numOfServices - 1)) {
                  console.log('Object: ' + resource);
                  console.log(serviceProvider);
                  returnResource.serviceProviders.push(serviceProvider);
                }

                if (index1 === (numOfServiceProviders - 1) && index6 === (numOfServices - 1)) {
                  callback(returnResource);
                }
              }); // node6
            }); // node5
          }); // node4
        }); // node3
      }); // node2
    }); // node1
  }

  function parseQueryBaseItems(queryBaseRdf, queryBaseUri, callback) {
    let returnResource = {
        title: 'untitle',
        rdf: queryBaseRdf,
        queryBaseItems: []
      },
      n1,
      numOfQueryBaseItems,
      queryBaseItem;

    returnResource.title = queryBaseUri.split('/').pop();
    n1 = jQuery(queryBaseRdf).find('rdf\\:Description[rdf\\:about="' + queryBaseUri + '"]');
    numOfQueryBaseItems = n1.length;
    n1.each(function (index1, node1) {
      jQuery(queryBaseRdf)
      .find('rdf\\:Description[rdf\\:about="' + queryBaseUri + '"] > rdfs\\:member').each(function (index2, node2) {
        queryBaseItem = {
          resourceUri: '',
          resourceTitle: ''
        };
        queryBaseItem.resourceUri = jQuery(node2).attr('rdf:resource');
        queryBaseItem.resourceTitle = queryBaseItem.resourceUri.split('/').pop();
        returnResource.queryBaseItems.push(queryBaseItem);
        if (index1 === (numOfQueryBaseItems - 1)) {
          callback(returnResource);
        }
      });
    });
  }

  return {
    version: (function () {
      return '1.0';
    }),
    helloOslc: (function () {
      alert('Hello OSLC!');
    }),
    parseServiceProviders: (function (rdf, callback) {
      parseServiceProviders(rdf, function (returnResource) {
        callback(returnResource);
      });
    }),
    parseQueryBaseItems: (function (queryBaseRdf, queryBaseUri, host, callback) {
      parseQueryBaseItems(queryBaseRdf, queryBaseUri, host, function (returnResource) {
        callback(returnResource);
      });
    }),
    parseXmlNS: (function (rdf, callback) {
      parseXmlNS(rdf, function (returnResource) {
        callback(returnResource);
      });
    })
  };

}());
