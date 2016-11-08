'use strict'

let debug = require('debug')('EmailService'),
  nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    debug('process.env.smtpUser = ', process.env.smtpUser);
    debug('process.env.smtpPassword = ', process.env.smtpPassword);
    debug('process.env.smtpHost = ', process.env.smtpHost);
    debug('loaded');
  }

  send(params, callback){
    let mailOptions = {
      from: '"' + params.senderName + '" <' + params.senderEmail + '>',
      to: params.recieptEmail,
      subject: params.subject,
      text: params.contentPlainText,
      html: params.contentHTML
    },
    transporter,
    url,
    result = {
      success: false,
      message: ''
    };

    if (process.env.smtpUser !== undefined &&
        process.env.smtpPassword !== undefined &&
        process.env.smtpHost !== undefined) {
      url = 'smtps://' + process.env.smtpUser + ':' + process.env.smtpPassword + '@' + process.env.smtpHost;
      debug('url = ', url);
      transporter = nodemailer.createTransport(url);
      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          result.message = error.toString();
          debug('result = ', result);
          if (callback) { callback(result); }
        } else {
          result.success = true;
          result.message = 'Send email successfully';
          debug('result = ', result);
          if (callback) { callback(result); }
        }
      });
    } else {
      result.message = 'process.smtpUser, process.smtpPassword, and process.smtpHost not found!';
      debug('result = ', result);
      if (callback) { callback(result); }
    }
    
  }
}

module.exports = EmailService
