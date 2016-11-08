'use strict';

let fs = require('fs'),
  childProcess = require('child_process'),
  spawn = childProcess.spawn,
  portscanner = require('portscanner'),
  conf = require('../conf/conf'),
  IO = require('./io');

/**
 * Runner class
 * @author Vorachet Jaroensawas <vorachet.jaroensawas@koneksys.com>
 */
class Runner {
  constructor() {
    this.portscanner = portscanner;
    this.childProcess = childProcess;
    this.io = new IO();
  }

  validateJson(json) {
    try {
      JSON.parse(json);
    } catch (e) {
      return false;
    }
    return true;
  }

  /**
   * checkServerPort
   * @param  {string}   port
   * @param  {string}   host
   * @param  {Function} callback - {true|false}
   */
  checkServerPort(port, host, callback) {
    this.portscanner.checkPortStatus(port ,host , function (error, status) {
      callback(status === 'open');
    });
  }

  /**
   * checkFUSEKIRunning
   * @param  {Function} callback  - {
        isRunning: true|false
      }
   */
  checkFUSEKIRunning(callback) {
    let result = {
        isRunning: false,
        message: '',
        fusekiPort: conf.fusekiPort,
        fusekiHost: conf.fusekiHost
      };

    this.portscanner.checkPortStatus(conf.fusekiPort ,conf.fusekiHost, function (error, fusekiStatus) {
      result.isRunning = fusekiStatus === 'open';
      if (result.isRunning) {
        result.message = 'Triplestore is running';
      } else {
        result.message = 'Triplestore is not running';
      }
      console.log(result.message);
      if (callback) { callback(result); }
    });
  }

  /**
   * checkSOLRRunning
   * @param  {Function} callback  - {
        isRunning: true|false
      }
   */
  checkSOLRRunning(callback) {
    let result = {
        isRunning: false,
        message: '',
        solrPort: conf.solrPort,
        solrHost: conf.solrHost
      };

    this.portscanner.checkPortStatus(conf.solrPort ,conf.solrHost, function (error, solrStatus) {
      result.isRunning = solrStatus === 'open';
      if (result.isRunning) {
        result.message = 'Search engine is running';
      } else {
        result.message = 'Search engine is not running';
      }
      console.log(result.message);
      if (callback) { callback(result); }
    });
  }

  /**
   * [startFUSEKI description]
   * @param  {string}   provisioning 
   * @param  {Function} callback - {
        success: true|false,
        message: ''
      }
   */
  startFUSEKI(provisioning, callback) {
    let self = this,
      provisioningJSON,
      serverStartScriptPath,
      spawnInstance,
      result = {
        success: false,
        message: ''
      }

    this.io.readProvisioningJSONOrFilePath(provisioning, function (verResult) {
      if (verResult.success) {
        provisioningJSON = verResult.json;
          serverStartScriptPath = provisioningJSON.provisioning.dbPath + '/profiles/' + provisioningJSON.provisioning.name + '.fuseki.start.sh';
          fs.exists(serverStartScriptPath, function (exists) {
            if (!exists) {
              result.message = serverStartScriptPath + ' is not exist!. ' +
                'You have add a new provisioning before starting Triplestore. ' +
                '';
              console.error(result.message);
              if (callback) { callback(result); }
            } else {
              spawnInstance = childProcess.exec(serverStartScriptPath);
              spawnInstance.stdout.on('data', function(data) {
                console.log('startFUSEKI spawn.stdout: ', data.toString());
                if (callback) { callback(result); }
              });
              spawnInstance.stderr.on('data', function(data) {
                console.log('startFUSEKI stderr.on: ',  data.toString());
              });
              spawnInstance.on('close', function(code) {
                console.log('startFUSEKI spawn exit code: ', code);
                result.success = true;
                result.message = 'Triplestore started!';
                console.log(result.message);
                if (callback) { callback(result); }
              });
            }
          });
      } else {
        if (callback) { callback(verResult); }
      }
    });
  }

  /**
   * startSOLR with mode
   * @param  {string}   provisioning
   * @param  {Function} callback - {
        success: true|false,
        message: ''
      }
   */
  startSOLR(provisioning, callback) {
    let self = this,
      provisioningJSON,
      serverStartScriptPath,
      spawnInstance,
      result = {
        success: false,
        message: ''
      }

    this.io.readProvisioningJSONOrFilePath(provisioning, function (verResult) {
      if (verResult.success) {
        provisioningJSON = verResult.json;
        serverStartScriptPath = provisioningJSON.provisioning.dbPath + '/profiles/' + provisioningJSON.provisioning.name + '.solr.start.sh';
        fs.exists(serverStartScriptPath, function (exists) {
          if (!exists) {
            result.message = serverStartScriptPath + ' is not exist!. ' +
              'You have add a new provisioning before starting search engine. ' +
              '';
            console.error(result.message);
            if (callback) { callback(result); }
          } else {
            spawnInstance = childProcess.exec('/bin/bash ' + serverStartScriptPath);
            spawnInstance.stdout.on('data', function(data) {
              console.log('startSOLR spawn.stdout: ', data.toString());
            });
            spawnInstance.stderr.on('data', function(data) {
              console.log('startSOLR stderr.on: ',  data.toString());
            });
            spawnInstance.on('close', function(code) {
              console.log('startSOLR spawn exit code: ', code);
              result.success = true;
              result.message = 'Search engine started!';
              console.log(result.message);
              setTimeout(function () {
                if (callback) { callback(result); }
              }, 1000);
            });
          }
        });
      } else {
        if (callback) { callback(verResult); }
      }
    });
  }

  /**
   * stop FUSEKI
   * @param  {Function} callback - {
        message: ''
      }
   */
  stopFUSEKI(callback) {
    let  spawnInstance,
      result = {
        success: false,
        message: ''
      };

    spawnInstance = spawn(__dirname + '/../bin/stopFUSEKIServer.sh', []);
    spawnInstance.stdout.on('data', function(data) {
      console.log('stopFUSEKIspawn.stdout: ', data.toString());
    });
    spawnInstance.stderr.on('data', function(data) {
      console.log('stopFUSEKI stderr.on: ',  data.toString());
    });
    spawnInstance.on('close', function(code) {
      console.log('stopFUSEKI spawn exit code: ', code);
      setTimeout(function () {
        result.success = true;
        result.message = 'Triplestore has been stopped';
        console.log(result);
        if (callback) { callback(result); }
      }, 1000);
    });
  }

  /**
   * stop SOLR
   * @param  {Function} callback - {
        message: ''
      }
   */
  stopSOLR(callback) {
    let  spawnInstance,
      result = {
        success: false,
        message: ''
      };

    spawnInstance = spawn(__dirname + '/../bin/stopSOLRServer.sh', []);
    spawnInstance.stdout.on('data', function(data) {
      console.log('stopSOLR spawn.stdout: ', data.toString());
    });
    spawnInstance.stderr.on('data', function(data) {
      console.log('stopSOLR stderr.on: ',  data.toString());
    });
    spawnInstance.on('close', function(code) {
      console.log('stopSOLR spawn exit code: ', code);
      setTimeout(function () {
        result.success = true;
        result.message = 'Search engine has been stopped';
        console.log(result);
        if (callback) { callback(result); }
      }, 1000);
    });
  }

}

module.exports = Runner;
