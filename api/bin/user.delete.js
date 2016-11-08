'use strict';

let  args = process.argv.slice(2),
  conf = require('../conf/conf.js'),
  mongoose    = require('mongoose'),
  email,
  password,
  clientId,
  dbUrl,
  connection,
  UserDAO = require('../model/user.dao.js'),
  userDAOInstance

if (args.length !== 2) {
  console.log('usage: npm run user.delete <email> <clientId>');
  console.log('example: npm run user.delete  newuser@example.com public');
  process.exit();
} else {
  email = args[0];
  clientId = args[1];

  dbUrl = conf.acceptedClients[clientId].dbUrl.local,
  console.log('dbUrl', dbUrl);
  console.log('email', email);
  console.log('clientId', clientId);
  userDAOInstance = new UserDAO()
  userDAOInstance.delete(dbUrl, {email: email}, function (result) {
    console.log(result)
  })
}



