"use strict";

let mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  EmailValidator = require('./emailValidator');

class Dataset {
  constructor(explicitConnection) {
    this.explicitConnection = explicitConnection;
    this.schema = new Schema({ 
        email: {
            type: 'string',
            trim: true,
            required: true
        },
        identifier: {
            type: 'string',
            trim: true,
            required: true
        },
        description: { type : 'string'},
        license: { type : 'string', required: true},
        organization: {type: 'string', required: true},
        creationDate: {type: 'date', required: true}
      });
    this.schema.index({ email: 1, identifier: 1 }, { unique: true });
  }

  getModel() {
    if (this.explicitConnection === undefined) {
      return mongoose.model('Dataset', this.schema);
    } else {
      return this.explicitConnection.model('Dataset', this.schema);
    }
  }
}

module.exports = Dataset;