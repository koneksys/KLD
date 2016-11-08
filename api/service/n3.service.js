'use strict'

let debug = require('debug')('N3Service'),
  Parser = require('rdf-parser-n3')

class N3Service {
  constructor() {
    this.parser = new Parser()
    debug('loaded')
  }

  validate(content, callback) {
    let result = {
        success: false,
        message: ''
      }

    try {
      this.parser.parse(content, function (err) {
        if (err) {
          result.message = 'invalid N3: ' + err.toString()
          if (callback) { callback(result) }
          return
        } else {
          result.success = true
          result.message = 'valid N3'
          if (callback) { callback(result) }
          return
        }
      })
    } catch (error) {
      result.message = 'invalid N3: ' + error.toString()
      if (callback) { callback(result) }
      return
    }
    
  }

}

module.exports = N3Service
