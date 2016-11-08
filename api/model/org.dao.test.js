'use strict';

let conf = require('../conf/conf.js'),
  dbUrl = conf.acceptedClients['ExampleCompany'].dbUrl.local,
  OrgDAO = require('./org.dao'),
  orgDao = new OrgDAO();

orgDao.load(dbUrl, {domain: 'http://example.com'}, function (result) {
  console.log('load()', result);
});


orgDao.find(dbUrl, {domain: 'http://example.com'}, function (result) {
  console.log('find()', result);
});