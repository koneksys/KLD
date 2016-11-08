"use strict"

let express = require('express'),
  debug = require('debug')('SecruityAPI'),
  url = require('url'),
  conf = require('../conf/conf.js'),
  jwt = require('jsonwebtoken'),
  UserDAO = require('../model/user.dao'),
  OrgDAO = require('../model/org.dao')

class SecruityAPI {

  constructor() {
    let self = this

    this.router = express.Router()
    this.router.get('/', function (req, res) {
      debug('/')
      res.json({message: 'Ping!'})
    })

    this.router.post('/', function (req, res) {
      debug('/')
      res.json({message: 'Ping!'})
    })

    this.router.post('/authen', function (req, res) {
      let client = {
          org: req.body.org,
          email: req.body.email,
          password: req.body.password,
          clientId: req.body.clientId
        }

      self.authen(req, res, client)
    })

    debug('loaded')
  }

  authen(req, res, client) {
    let token,
      ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    debug('/authen')
    debug('org = ', client.org)
    debug('email = ', client.email)
    debug('password = ', client.password)
    debug('clientId = ', client.clientId)

    if (client.org === undefined || client.org === '') {
      debug('Authentication failed. org is required')
      res.json({success: false, message: 'Authentication failed. Organization is required'})
      return
    }

    if (client.email === undefined || client.email === '') {
      debug('Authentication failed. email is required')
      res.json({success: false, message: 'Authentication failed. Email is required'})
      return
    }

    if (client.password === undefined || client.password === '') {
      debug('Authentication failed. password is required')
      res.json({success: false, message: 'Authentication failed. Password is required'})
      return
    }

    if (client.clientId === undefined || client.clientId === '') {
      debug('Authentication failed. clientId is required')
      res.json({success: false, message: 'Authentication failed. ClientId is required'})
      return
    }

    new UserDAO().load(global.dbUrls[client.clientId], {email: client.email}, function (loadResult) {
      debug('loadResult = ', loadResult);
      if (!loadResult.success) {
        debug('Authentication failed. Server error')
        res.json({success: false, message: 'Authentication failed. ' + loadResult.message})
      } else {
        if (loadResult.entity.password !== client.password) {
          debug('Authentication failed. Wrong password')
          res.json({success: false, message: 'Authentication failed. Wrong password'})
        } else {
          token = jwt.sign(loadResult.entity, conf.serverToken, {
            expiresIn: 86400 // expires in 24 hours
          })

          new OrgDAO().load(global.dbUrls[client.clientId], {organization: loadResult.entity.organization}, function (orgLoadResult) {
            if (orgLoadResult.success) {
              let returnProfile = {
                success: true,
                message: 'Enjoy your token!',
                token: token,
                profile: loadResult.entity,
                org: orgLoadResult.entity
              };
              debug('authen() returnProfile = ', returnProfile);
              res.json(returnProfile);
            } else {
              res.json({
                success: false,
                message: 'Cannot find domain of ' + loadResult.entity.organization
              })
            }
          });
          
        }
      } 
    })
  }

  getRouter() {
    return this.router
  }
}

module.exports = SecruityAPI
