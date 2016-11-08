'use strict';

let DAO = require('../model/dao'),
  Dataset = require('../model/dataset')

class DatasetDAO extends DAO {

  load(dbUrl, where, callback) {
    super.load(Dataset, dbUrl, where, callback);
  }

  find(dbUrl, where, callback) {
    super.find(Dataset, dbUrl, where, callback);
  }

  create(dbUrl, attrs, callback) {
    super.create(Dataset, dbUrl, attrs, callback);
  }

  delete(dbUrl, where, callback) {
    super.delete(Dataset, dbUrl, where, callback);
  }

  update(dbUrl, where, attrs, callback) {
    super.update(Dataset, dbUrl, where, attrs, callback);
  }

  updateSet(dbUrl, where, attrs, callback) {
    super.updateSet(Dataset, dbUrl, where, attrs, callback);
  }

  updatePush(dbUrl, where, attrs, callback) {
    super.updatePush(Dataset, dbUrl, email, attrs, callback);
  }

}

module.exports = DatasetDAO
