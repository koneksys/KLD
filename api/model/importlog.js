"use strict";

let mongoose = require('mongoose'),
  Schema = mongoose.Schema;

class ImportLog {
  constructor(explicitConnection) {
    console.log('ImportLog loaded');
    this.explicitConnection = explicitConnection;
    this.schema = new Schema({ 
        organization: {
          type: 'string',
          trim: true,
          required: true
        },
        email: {
          type: 'string',
          trim: true,
          required: true
        },
        creationDate: {type: 'date', required: true},
        logs: []
      });
  }

  getModel() {
    if (this.explicitConnection === undefined) {
      return mongoose.model('ImportLog', this.schema);
    } else {
      return this.explicitConnection.model('ImportLog', this.schema);
    }
  }
}

module.exports = ImportLog;