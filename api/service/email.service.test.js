'use strict'

let EmailService = require('./email.service'),
  dotenv = require('dotenv'),
  email;

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

dotenv.load();
email = new EmailService();
email.send({
    senderName: 'Admin',
    senderEmail: 'noreply@lodhub.com',
    recieptEmail: 'vorachet@gmail.com',
    subject: 'Test',
    contentPlainText: 'Test',
    contentHTML: '<h1>Test</h1>'
  },
  function (result) {
    console.log('result = ', result);
  }
);
