"use strict";

let debug = require('debug')('BaseAPI'),
  conf = require('../conf/conf.js');

class BaseAPI {

  constructor() {
    debug('loaded');
  }

  kickUnacceptedKldClient(query, expressJSResponse) {
    let reason = '',
        clientId = query.clientId,
        email = query.email,
        acceptedClient = conf.acceptedClients[clientId];

    debug('clientId = ', clientId);
    debug('email = ', email);
    if (acceptedClient !== undefined) {
      if (email === undefined || email === '') {
        debug('empty email is not allowed');
        expressJSResponse.status(401).send('empty clientUserId is not allowed');
        return false;
      }
      if (acceptedClient.blockedUserEmails[email]) {
        debug(email + ' is a blocked client user');
        reason = acceptedClient.blockeduserEmails[email].reason;
        debug('reason: ' + acceptedClient.blockeduserEmails[email].reason);
        expressJSResponse.status(401).send('blocked client user <br>reason: ' + reason);
        return false;
      } else {
        return true;
      }
    } else {
      debug(clientId + ' is not a valid client id');
      expressJSResponse.status(401).send('invalid clientId');
      return false;
    }
  }

  kickUnacceptedAdminClient(query, security, expressJSResponse) {
    let clientId = query.clientId,
        email = query.email,
        acceptedClient = conf.acceptedClients[clientId],
        acceptedAdminEmail,
        isAuthorized;

    debug('clientId = ', clientId);
    debug('email = ', email);
    if (acceptedClient !== undefined) {
      acceptedAdminEmail = acceptedClient.acceptedClientAdminEmails[email];
      if (acceptedAdminEmail !== undefined) {
        isAuthorized = acceptedAdminEmail.authorization[security.requiredAuthorization];
        if (isAuthorized) {
          return true;
        } else {
          debug(email + ' requires ' + security.requiredAuthorization + ' authorization');
          expressJSResponse.status(401).send(security.requiredAuthorization + ' authorization is required');
          return false;
        }
      } else {
        debug(email + ' is not an admin');
        expressJSResponse.status(401).send(email + ' is not an admin');
        return false
      }
    } else {
      debug(clientId + ' is not a valid kld-client');
      expressJSResponse.status(401).send('invalid kld-client');
      return false
    }
  }
}

module.exports = BaseAPI;
