'use strict'

let debug = require('debug')('JsonLdService')

class JsonLdService {
  constructor() {
    debug('loaded')
  }

  validate(content, callback) {
    let result = {
        success: false,
        message: '',
        file: {}
      },
      jsonld = require('jsonld')

    try {
      jsonld.promises().normalize(JSON.parse(content), function (err, data) {
        if (err === null || err === undefined) {
          debug('jsonld data = ', data);
          result.success = true
          result.message = 'valid jsonld'
          if (callback) { callback(result) }
        } else {
          result.message = 'invalid jsonld'
          if (callback) { callback(result) }
        }
      })
    } catch (error) {
      result.message = 'invalid jsonld: ' + error.toString()
      debug(result);
      if (callback) { callback(result) }
      return
    }
    
  }

}

module.exports = JsonLdService
