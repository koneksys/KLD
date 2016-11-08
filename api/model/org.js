"use strict";

let mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  EmailValidator = require('./emailValidator');

class Org {
  constructor(explicitConnection) {
    console.log('Org loaded');
    this.explicitConnection = explicitConnection;
    this.schema = new Schema({ 
        organization: {
            type: 'string',
            trim: true,
            required: true,
            unique: true
        },
        domain: {
            type: 'string',
            trim: true,
            required: true
        },
        email: {
            type: 'string',
            trim: true,
            required: true
        },
        description: { type : 'string'},
        logoSmall: { type : 'string'},
        logoLarge: { type : 'string'},
        address: { type : 'string'},
        contact: { type : 'string'},
        events: [],
        creationDate: {type: 'date', required: true}
      });
  }

  getModel() {
    if (this.explicitConnection === undefined) {
      console.log('Org getModel mongoose');
      return mongoose.model('Org', this.schema);
    } else {
      console.log('Org getModel explicitConnection');
      return this.explicitConnection.model('Org', this.schema);
    }
  }
}

module.exports = Org;