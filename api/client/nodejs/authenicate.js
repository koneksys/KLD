'use strict'

let dotenv = require('dotenv'),
    request = require('request');

dotenv.load();

console.log('apiServerBaseUrl = ', process.env.apiServerBaseUrl);
console.log('clientId = ', process.env.clientId);
console.log('email = ', process.env.email);
console.log('password = ', process.env.password);

let req =  {
    org: process.env.clientId,
    clientId: process.env.clientId,
    email: process.env.email,
    password: process.env.password
  };

let requestParams = {
  uri: process.env.apiServerBaseUrl + '/security/authen',
  headers: {
    accept: 'application/json',
    'content-type': 'application/json'
  },
  body: JSON.stringify(req)
};

request.post(requestParams, function(err, response, body) {
  if (err) {
    console.log('found error ', err);
  } else {
    let result = JSON.parse(body);

    console.log('status = ', result.success);
    console.log('token = ', result.token);
    console.log('profile = ', result.profile);
    console.log('org = ', result.org);
  }
});
