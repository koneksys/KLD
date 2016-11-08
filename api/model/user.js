"use strict";

let mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  EmailValidator = require('./emailValidator');

class User {
  constructor(explicitConnection) {
    this.explicitConnection = explicitConnection;
    this.schema = new Schema({
        email: {
            type: 'string',
            trim: true,
            required: true
        },
        organization: {
            type: 'string',
            trim: true,
            required: true
        },
        password: {type: 'string', required: true},
        isVisibleAccount: {type: 'boolean'},
        userApiKey: {type: 'string'},
        userApiSecret: {type: 'string'},
        linkedApps: {},
        avatarProto: {type: 'string'},
        gmailAccount: {type: 'string'},
        facebookAccount: {type: 'string'},
        twitterAccount: {type: 'string'},
        fullname: {type: 'string'},
        loginHistories: [],
        changeProfileHistories: [],
        changeAuthorizationHistories: [],
        sparqlQuestions: [],
        blockingHistories: [],
        authorizations: {},
        tripleUsage: {type: 'number', default: 0},
        tripleUsageHistory: [],
        isBlocked: {
            type: 'boolean',
            required: true
        },
        blockedCause: {
            type: 'string',
        }
      }).index({ email: 1, organization: 1 }, { unique: true });
  }

  getModel() {
    if (this.explicitConnection === undefined) {
      return mongoose.model('User', this.schema);
    } else {
      return this.explicitConnection.model('User', this.schema);
    }
  }
}

module.exports = User;