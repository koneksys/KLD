'use strict';

let  args = process.argv.slice(2),
  conf = require('../conf/conf.js'),
  mongoose    = require('mongoose'),
  email,
  attrs,
  attrsJson,
  clientId,
  mode,
  dbUrl,
  connection,
  UserDAO = require('../model/user.dao.js'),
  userDAOInstance

if (args.length !== 4) {
  console.log('usage: npm run user.update <mode> <email> <attr> <clientId>');
  console.log('example: npm run user.update set newuser@example.com "{\\\"fullname\\\": \\\"Edited\\\"}" public');
  console.log('example: npm run user.update push newuser@example.com "{\\\"loginHistories\\\": [\\\"Today\\\"]}" public');
  process.exit();
} else {
  mode = args[0];
  email = args[1];
  attrs = args[2];
  clientId = args[3];

  try {
    attrsJson = JSON.parse(attrs)
  } catch(err) {
    console.error(err)
    process.exit(0)
  }
  dbUrl = conf.acceptedClients[clientId].dbUrl.local,
  console.log('dbUrl', dbUrl);
  console.log('mode', mode);
  console.log('email', email);
  console.log('attrs', attrsJson);
  console.log('clientId', clientId);
  userDAOInstance = new UserDAO()
  if (mode === 'set') {
    userDAOInstance.updateSet(dbUrl, email, attrsJson, function (result) {
      console.log(result)
    })
  } else if (mode === 'push') {
    userDAOInstance.updatePush(dbUrl, email, attrsJson, function (result) {
      console.log(result)
    })
  } else {
    console.error('mode must be set or push');
  }
}



