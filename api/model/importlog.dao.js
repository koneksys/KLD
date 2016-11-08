'use strict';

let DAO = require('./dao'),
  ImportLog = require('../model/importlog')

class ImportLogDAO extends DAO {

  constructor() {
    super();
    console.log('OrgDAO loaded');
  }

  load(dbUrl, where, callback) {
    super.load(ImportLog, dbUrl, where, callback);
  }

  find(dbUrl, where, callback) {
    super.find(ImportLog, dbUrl, where, callback);
  }

  create(dbUrl, attrs, callback) {
    super.create(ImportLog, dbUrl, attrs, callback);
  }

  delete(dbUrl, where, callback) {
    super.delete(ImportLog, dbUrl, where, callback);
  }

  update(dbUrl, where, attrs, callback) {
    super.update(ImportLog, dbUrl, where, attrs, callback);
  }

  updateSet(dbUrl, where, attrs, callback) {
    super.updateSet(ImportLog, dbUrl, where, attrs, callback);
  }

  updatePush(dbUrl, email, attrs, callback) {
    super.updatePush(ImportLog, dbUrl, email, attrs, callback);
  }

}

module.exports = ImportLogDAO
