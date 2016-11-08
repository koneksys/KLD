'use strict'

let dotenv = require('dotenv'),
    fs = require('fs'),
    request = require('request'),
    token = fs.readFileSync('../token.txt').toString();

dotenv.load();

let req =  {
    clientId: process.env.clientId,
    email: process.env.email
  };

let requestParams = {
  uri: process.env.apiServerBaseUrl + '/api/user/load',
  headers: {
    accept: 'application/json',
    'content-type': 'application/json',
    'x-access-token': token
  },
  body: JSON.stringify(req)
};

request.post(requestParams, function(err, response, body) {
  if (err) {
    console.log('found error ', err);
  } else {
    let result = JSON.parse(body);

    console.log('result = ', result);
  }
});
