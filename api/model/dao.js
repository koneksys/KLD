'use strict';

let debug = require('debug')('DAO'),
  mongoose = require('mongoose'),
  conf = require('../conf/conf');

class DAO {

  constructor() {
    console.log('DAO loaded');
  }

  load(theClass, dbUrl, where, callback) {
    let connection = mongoose.createConnection(),
      result = {
        success: false,
        message: '',
        entity: {}
      }

    debug('load() dbUrl = ', dbUrl)
    debug('load() where = ', where)
    connection.on('error', function (err) {
      result.message = err.toString()
      connection.close()
      callback(result)
    })
    connection.open(dbUrl, conf.mongooseOptions).then(function () {
      new theClass(connection).getModel().findOne(where, function (err, doc) {
        if (err) {
          result.message = err.toString();
          connection.close()
          callback(result)
        } else {
          result.success = doc === null ? false : true;
          result.message = doc === null ? 'not found' : 'loaded';
          result.entity = doc === null ? undefined : doc;
          callback(result)
          connection.close()
        }
      })
    })
  }

  find(theClass, dbUrl, where, callback) {
    let connection = mongoose.createConnection()

    connection.on('error', function (err) {
      callback({
        success: false, message: err.toString()
      })
      connection.close()
    })

    debug('dbUrl = ', dbUrl);
    debug('where = ', where);
    connection.open(dbUrl, conf.mongooseOptions).then(function () {
      new theClass(connection).getModel().find(where, function (err, docs) {
        debug('err = ', err);
        if (err) {

          callback({
            success: false, message: err.toString()
          })
          connection.close()
        } else {
          callback({
            success: docs.length === 0 ? false : true,
            message: docs.length === 0 ? 'not found' : 'found ' + docs.length + ' entities',
            entities: docs.length === 0 ? [] : docs
          })
          connection.close()
        }
      })
    })
  }

  create(theClass, dbUrl, attrs, callback) {
    let connection = mongoose.createConnection()

    connection.on('error', function (err) {
      callback({
        success: false, message: err.toString()
      })
      connection.close()
    })
    connection.open(dbUrl).then(function () {
      let UserModel = new theClass(connection).getModel(),
        newEntity = new UserModel(),
        keys = Object.keys(attrs)

      debug('newEntity=', newEntity)
      keys.forEach(function (attr, index) {
        newEntity[attr] = attrs[attr]
        debug('newEntity['  + attr + ']=' + attrs[attr])
        if (index === keys.length - 1) {
          debug('newEntity=', newEntity)
          newEntity.save(function(err, createdEntity) {
            if (err) {
              callback({
                success: false, message: err.toString()
              })
              connection.close()
            } else {
              callback({
                success: true, message: 'created', entity: createdEntity
              })
              connection.close()
            }
          })
        }
      })
    })
  }

  delete(theClass, dbUrl, where, callback) {
    let connection = mongoose.createConnection()

    connection.on('error', function (err) {
      callback({
        success: false, message: err.toString()
      })
      connection.close()
    })
    connection.open(dbUrl, conf.mongooseOptions).then(function () {
      new theClass(connection).getModel().remove(where, function (err) {
        if (err) {
          callback({
            success: false, message: err.toString()
          })
          connection.close()
        } else {
          callback({
            success: true,
            message: 'deleted'
          })
          connection.close()
        }
      })
    })
  }

  update(theClass, dbUrl, where, attrs, callback) {
    let connection = mongoose.createConnection(),
      keys = Object.keys(attrs),
      UserModel = new theClass(connection).getModel()

    connection.on('error', function (err) {
      callback({
        success: false, message: err.toString()
      })
      connection.close()
    })
    connection.open(dbUrl, conf.mongooseOptions).then(function () {
      UserModel.findOneAndUpdate(where, attrs,function (err, entity) {
        if (err) {
          callback({
            success: false, message: err.toString()
          })
          connection.close()
        } else {
          callback({
            success: true,
            message: 'updated',
            entity: entity
          })
          connection.close()
        }
      })
    })
  }

  updateSet(theClass, dbUrl, where, attrs, callback) {
    let connection = mongoose.createConnection(),
      keys = Object.keys(attrs),
      UserModel = new theClass(connection).getModel()

    connection.on('error', function (err) {
      callback({
        success: false, message: err.toString()
      })
      connection.close()
    })
    connection.open(dbUrl, conf.mongooseOptions).then(function () {
      UserModel.findOneAndUpdate(where, attrs,function (err, entity) {
        if (err) {
          callback({
            success: false, message: err.toString()
          })
          connection.close()
        } else {
          callback({
            success: true,
            message: 'updated',
            entity: entity
          })
          connection.close()
        }
      })
    })
  }

  updatePush(theClass, dbUrl, where, attrs, callback) {
    let connection = mongoose.createConnection(),
      keys = Object.keys(attrs),
      UserModel = new theClass(connection).getModel()

    connection.on('error', function (err) {
      callback({
        success: false, message: err.toString()
      })
      connection.close()
    })
    connection.open(dbUrl, conf.mongooseOptions).then(function () {
      UserModel.findOneAndUpdate(where, {$pushAll: attrs},function (err, entity) {
        if (err) {
          callback({
            success: false, message: err.toString()
          })
          connection.close()
        } else {
          callback({
            success: true,
            message: 'updated',
            entity: entity
          })
          connection.close()
        }
      })
    })
  }

}

module.exports = DAO
