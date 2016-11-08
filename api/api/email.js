"use strict";

let express = require('express'),
  debug = require('debug')('EmailAPI'),
  url = require('url'),
  conf = require('../conf/conf.js'),
  BaseAPI = require('./base'),
  EmailService = require('../service/email.service');

class EmailAPI extends BaseAPI {

  constructor() {
    super();
    let self = this;

    this.router = express.Router();
    this.router.post('/send', function(req, res) {
      let senderName = req.body.senderName,
        senderEmail = req.body.senderEmail,
        recieptEmail =  req.body.recieptEmail,
        subject =  req.body.subject,
        contentPlainText =  req.body.contentPlainText,
        contentHTML =  req.body.contentHTML,
        result = {
          success: false,
          message: '',
          ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
          headers: req.headers,
          profile: {}
        };

      if (!self.kickUnacceptedKldClient(req.body, res)) return;
      self.email({
        senderName: senderName,
        senderEmail: senderEmail,
        recieptEmail: recieptEmail,
        subject: subject,
        contentPlainText: contentPlainText,
        contentHTML: contentHTML}, function (result) {
        res.json(result);
      });
    });

    debug('loaded');
  }

  email(params, callback) {
    new EmailService().send(params, function (result) {
        callback(result);
      }
    );
  }

  getRouter() {
    return this.router;
  }
}

module.exports = EmailAPI;
