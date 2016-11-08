'use strict';

let debug = require('debug')('UserDAO'),
  DAO = require('../model/dao'),
  User = require('../model/user')

class UserDAO extends DAO {
  constructor() {
    super();
    debug('loaded');
  }

  load(dbUrl, where, callback) {
    super.load(User, dbUrl, where, callback);
  }

  find(dbUrl, where, callback) {
    super.find(User, dbUrl, where, callback);
  }

  create(dbUrl, attrs, callback) {
    super.create(User, dbUrl, attrs, callback);
  }

  delete(dbUrl, where, callback) {
    super.delete(User, dbUrl, where, callback);
  }

  update(dbUrl, where, attrs, callback) {
    super.update(User, dbUrl, where, attrs, callback);
  }

  updateSet(dbUrl, where, attrs, callback) {
    super.updateSet(User, dbUrl, where, attrs, callback);
  }

  updatePush(dbUrl, email, attrs, callback) {
    super.updatePush(User, dbUrl, email, attrs, callback);
  }

}

module.exports = UserDAO
