function deleteAllImportLogTriplesInSolr(solrDocs){

  var solrReturnDocsLength = solrDocs.response.docs.length;
      for (var i = 0; i < solrReturnDocsLength; i++) {
        var subjectUri = solrDocs.response.docs[i].uri[0];
        subjectUri = subjectUri.replace(/:/g,"\\:"); 
        var deletion_string = '<delete><query>(uri:' + subjectUri + ')</query></delete>';
    var update_url = DEFAULT_SOLR_UPDATE_URL + escape(deletion_string);       
    callSolrUpdate(update_url,function(data){
      debug('deleteAllImportLogTriplesInSolr : update_url : ' + update_url + ' : ' + data.isCompleted);
    });
  }
}


function callSolrUpdate(update_url,callback){
  debug('callSolrUpdate update_url : ' + update_url);
  request.post(
    { 
      url:update_url, 
      form: {
      }
    }, function(err,httpResponse,body)
    { 
      var data = {
        "isCompleted" : false,
        "message" : ''
      };
      if(err){
        data.isCompleted = false;
        data.message = 'Found error on index udpate';
      }else{
        data.isCompleted = true;
        data.message = 'index updated';
      }
      callback(data);
    }
  );
}

     */
    function sendSolrDeletion( row , callback){

        var subject_resource_uri = row.subjectCol.resource_uri.replace(/:/g,"\\:"); 
        var predicate_resource_name = row.predicateCol.resource_name.replace(/:/g,"_"); 
        var object_resource_uri = row.objectCol.resource_uri.replace(/:/g,"\\:");  

        var deletion_string = '<delete><query>(uri:' + subject_resource_uri + ') AND (' + predicate_resource_name + ':' + object_resource_uri + ')</query></delete>';

        var update_url = $scope.solr_update_url + escape(deletion_string);
        $rootScope.processLabel = $http.post( KLD_SERVICE.createLocalWebServiceURL('/send_solr_delete'), { "update_url" : update_url } ).
          success(function(data, status, headers, config) {  
            callback ( data ); 
          }).
          error(function(data, status, headers, config) {
            var dialogSetting = {
                showCLOSE: true, 
                title: 'Error Message', 
                body:  'Found error in sending SOLR deletion request'
            };
            KLD_SERVICE.openModalDialog( dialogSetting, function(status){});
          });
    }

});