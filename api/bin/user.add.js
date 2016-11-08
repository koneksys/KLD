'use strict';

let  args = process.argv.slice(2),
  conf = require('../conf/conf.js'),
  mongoose    = require('mongoose'),
  email,
  password,
  organization,
  isAdmin,
  dbUrl,
  connection,
  UserDAO = require('../model/user.dao.js'),
  userDAOInstance

if (args.length !== 4) {
  console.log('usage: npm run user.add <email> <password> <organization> <isAdmin>');
  console.log('example: npm run user.add  demo@example.com demo ExampleCompany true');
  process.exit();
} else {
  email = args[0];
  password = args[1];
  organization = args[2];
  isAdmin = args[3];

  dbUrl = conf.acceptedClients[organization].dbUrl.local,
  console.log('dbUrl', dbUrl);
  console.log('email', email);
  console.log('password', password);
  console.log('organization', organization);
  userDAOInstance = new UserDAO()
  userDAOInstance.create(dbUrl, {
      organization: organization,
      email: email,
      password: password,
      isBlocked: true,
      blockedCause: 'Exceed max number of triples',
      authorizations: {
        dashboard: true,
        datasets: true,
        sparql: true,
        types: true,
        searchandedit: true,
        import: true
      }
    }, function (result) {
    console.log(result)
  })
}



