'use strict';

let  args = process.argv.slice(2),
  conf = require('../conf/conf.js'),
  mongoose    = require('mongoose'),
  organization,
  domain,
  email,
  description,
  dbUrl,
  connection,
  OrgDAO = require('../model/org.dao.js'),
  orgDAOInstance

if (args.length !== 4) {
  console.log('usage: npm run org.add <organization> <domain> <email> <description>');
  console.log('example: npm run org.add ExampleCompany http://example.com info@example.com "We are ExampleCompany"');
  process.exit();
} else {
  organization = args[0];
  domain = args[1];
  email = args[2];
  description = args[3];

  dbUrl = conf.acceptedClients[organization].dbUrl.local;
  if (dbUrl === undefined) {
    console.error('organization = ' + organization + ' not found in API SERVER');
    process.exit(0)
  }
  console.log('dbUrl', dbUrl);
  console.log('organization', organization);
  console.log('domain', domain);
  console.log('email', email);
  console.log('description', description);
  orgDAOInstance = new OrgDAO()

  orgDAOInstance.create(dbUrl, {
    organization: organization,
    domain: domain,
    email: email,
    description: description,
    logoSmall: '',
    logoLarge: '',
    address: '',
    contact: '',
    events: [],
    creationDate: new Date()}, function (result) {
    console.log(result)
  })
}



