"use strict"

let express = require('express'),
  debug = require('debug')('DatasetAPI'),
  url = require('url'),
  conf = require('../conf/conf.js'),
  jwt = require('jsonwebtoken'),
  DatasetDAO = require('../model/dataset.dao')

class DatasetAPI {

  constructor() {
    let self = this

    this.router = express.Router()
    this.router.get('/', function (req, res) {
      debug('GET /')
       self.load(req, res)
    })
    this.router.post('/', function (req, res) {
      debug('POST /')
      self.add(req, res)
    })

    debug('loaded')
  }

  load(req, res) {
    let email = req.query.email,
      clientId = req.query.clientId,
      result = {
        success: false,
        message: '',
        entities: []
      }

    debug('load() email = ', email)
    debug('load() clientId = ', clientId)
    new DatasetDAO().find(global.dbUrls[clientId], {email: email}, function (loadResult) {
      if (loadResult.success) {
        result.success = true
        result.message = loadResult.message
        result.entities = loadResult.entities
        debug('load() result = ', result)
        res.json(result)
      } else {
        result.message = loadResult.message
        debug('load() result = ', result)
        res.json(result)
      } 
    })
  }


  add(req, res) {
    let email = req.body.email,
      clientId = req.body.clientId,
      identifier = req.body.identifier,
      description = req.body.description,
      license = req.body.license,
      attrsJson = {
        datasets: [{
          identifier: identifier,
          description: description,
          license: license,
          creationDate: new Date()
        }]
      },
      result = {
        success: false,
        message: ''
      },
      datasetDAOInstance = new DatasetDAO();

    debug('add() email = ', email)
    debug('add() clientId = ', clientId)
    debug('add() identifier = ', identifier)
    debug('add() description = ', description)
    debug('add() license = ', license)
    datasetDAOInstance.create(global.dbUrls[clientId], {
      email: email,
      identifier: identifier,
      description: description,
      license: license,
      organization: clientId,
      creationDate: new Date()}, function (createResult) {
      if (createResult.success) {
        result.success = true
        result.message = createResult.message
        debug('add() result = ', result)
        res.json(result)
      } else {
        result.message = createResult.message
        if (result.message.indexOf('E11000 duplicate key error') !== -1) {
          result.message = 'Duplicate dataset identifier';
        }
        debug('add() result = ', result)
        res.json(result)
      }
    })
  }

  getRouter() {
    return this.router
  }
}

module.exports = DatasetAPI
