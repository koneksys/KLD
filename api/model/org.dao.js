'use strict';

let DAO = require('./dao'),
  Org = require('../model/org')

class OrgDAO extends DAO {

  constructor() {
    super();
    console.log('OrgDAO loaded');
  }

  load(dbUrl, where, callback) {
    super.load(Org, dbUrl, where, callback);
  }

  find(dbUrl, where, callback) {
    super.find(Org, dbUrl, where, callback);
  }

  create(dbUrl, attrs, callback) {
    super.create(Org, dbUrl, attrs, callback);
  }

  delete(dbUrl, where, callback) {
    super.delete(Org, dbUrl, where, callback);
  }

  update(dbUrl, where, attrs, callback) {
    super.update(Org, dbUrl, where, attrs, callback);
  }

  updateSet(dbUrl, where, attrs, callback) {
    super.updateSet(Org, dbUrl, where, attrs, callback);
  }

  updatePush(dbUrl, email, attrs, callback) {
    super.updatePush(Org, dbUrl, email, attrs, callback);
  }

}

module.exports = OrgDAO
