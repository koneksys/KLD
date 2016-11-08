'use strict';

let  args = process.argv.slice(2),
  conf = require('../conf/conf.js'),
  mongoose    = require('mongoose'),
  email,
  where,
  whereJson,
  clientId,
  mode,
  dbUrl,
  connection,
  UserDAO = require('../model/user.dao.js'),
  userDAOInstance

if (args.length !== 2) {
  console.log('usage: npm run user.find <where> <clientId>');
  console.log('example: npm run user.find "{\\\"email\\\": \\\"newuser@example.com\\\"}" public');
  process.exit();
} else {
  where = args[0];
  clientId = args[1];

  try {
    whereJson = JSON.parse(where)
  } catch(err) {
    console.error(err)
    process.exit(0)
  }
  dbUrl = conf.acceptedClients[clientId].dbUrl.local,
  console.log('dbUrl', dbUrl);
  console.log('where', whereJson);
  console.log('clientId', clientId);
  userDAOInstance = new UserDAO()
  userDAOInstance.find(dbUrl, whereJson, function (result) {
    result.entities.forEach(function(user, index) {
      console.log('Doc: ' + index + 1)
      console.log('\t', JSON.stringify(user, null, 10))
    })
  })
}



