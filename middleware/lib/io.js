'use strict';

let fs = require('fs'),
  rimraf = require('rimraf'),
  UUID = require('node-uuid'),
  debug = require('debug')('io');

/**
 * IO class
 * @author Vorachet Jaroensawas <vorachet.jaroensawas@koneksys.com>
 */
class IO {
  constructor() {
  }

  /**
   * validateJson
   * @param  {string} - text 
   * @return {boolean}  - true|false
   */
  validateJson(text) {
    let validJson;

    try {
      validJson = JSON.parse(text);
      return true;
    } catch (e) {
      console.log('invalid json = ', text);
      return false;
    }
  }

    /**
   * generateUUID
   * @return {string} UUID v.4
   */
  generateUUID() {
    return UUID.v4();
  }

  /**
   * writeFile
   * @param  {string}   filePath    
   * @param  {string}   fileContent 
   * @param  {integer}   fileMode        
   * @param  {Function} callback - {
        success: true|false,
        message: ''
      }
   */
  writeFile(filePath, fileContent, fileMode, callback) {
    let result = {
      success: false,
      message: ''
    };

    fs.writeFile(filePath, fileContent, function (err) {
      if (err) {
        result.message = err.toString();
        console.error(result.message);
        if (callback) { callback(result); }
      } else {
        fs.chmod(filePath, fileMode, function (modErr) {
          if (modErr) {
            result.message = modErr.toString();
            console.error(result.message);
            if (callback) { callback(result); }
          } else {
            result.success = true;
            result.message = filePath + ' has been written with file mode = ' + fileMode;
            console.log(result.message);
            if (callback) { callback(result); }
          }
        });
      }
    });
  }

  /**
   * deleteDirectoryRecursively 
   * @param  {string} directoryPath 
   */
  deleteDirectoryRecursively(directoryPath) {
    rimraf.sync(directoryPath);
    console.log('\t' + directoryPath + ' has been deleted!');
  }

  /**
   * readProvisioningJSONOrFilePath
   * @param  {string}   provisioning
   * @param  {Function} callback - {
        success: true|false,
        json: {},
        message: ''
      }
   */
  readProvisioningJSONOrFilePath(provisioning, callback) {
    let self = this,
      json,
      provisioningContent,
      result = {
        success: false,
        json: {},
        message: ''
      };

    if (this.validateJson(provisioning)) {
      debug('provisioning=JSON');
      json = JSON.parse(provisioning);
      if (this.verifyProvisioningJSON(json)) {
        result.success = true;
        result.json = json;
        if (callback) { callback(result); }
      } else {
        result.message = 'Not a valid provisioning json';
        if (callback) { callback(result); }
      }
    } else {
      fs.exists(provisioning, function (exists) {
        if (exists) {
          console.log('provisioning=FILE');
          provisioningContent = fs.readFileSync(provisioning).toString();
          if (self.validateJson(provisioningContent)) {
            json = JSON.parse(provisioningContent);
            if (self.verifyProvisioningJSON(json)) {
              result.success = true;
              result.json = json;
              result.message = 'valid provision json';
              console.log(result.message);
              if (callback) { callback(result); }
            } else {
              result.message = 'Not a valid provisioning json';
              console.log(result.message);
              if (callback) { callback(result); }
            }
          } else {
            result.message = 'provisioning=' + provisioning +' is not a valid json!';
            console.log(result.message);
            if (callback) { callback(result); }
          }
        } else {
          result.message = 'provisioning=' + provisioning +' does not exist!';
          console.log(result.message);
          if (callback) { callback(result); }
        }
      });
    }
  }

  /**
   * verifyProvisioningJSON
   * @param  {string} validJSON
   * @return {boolean} true|false
   */
  verifyProvisioningJSON(validJSON) {
    return true;
  }

  /**
   * readConfPatchJSONOrFilePath
   * @param  {string}   patch
   * @param  {Function} callback - {
        success: true|false,
        json: {},
        message: ''
      }
   */
  readConfPatchJSONOrFilePath(patch, callback) {
    let self = this,
      json,
      patchContent,
      result = {
        success: false,
        json: {},
        message: ''
      };

    if (this.validateJson(patch)) {
      console.log('patch=JSON');
      json = JSON.parse(patch);
      if (this.verifyPatchJSON(json)) {
        result.success = true;
        result.json = json;
        if (callback) { callback(result); }
      } else {
        result.message = 'Not a valid patch json';
        if (callback) { callback(result); }
      }
    } else {
      fs.exists(patch, function (exists) {
        if (exists) {
          console.log('patch=FILE');
          patchContent = fs.readFileSync(patch).toString();
          if (self.validateJson(patchContent)) {
            json = JSON.parse(patchContent);
            if (self.verifyConfPatchJSON(json)) {
              result.success = true;
              result.json = json;
              result.message = 'valid provision json';
              console.log(result.message);
              if (callback) { callback(result); }
            } else {
              result.message = 'Not a valid patch json';
              console.log(result.message);
              if (callback) { callback(result); }
            }
          } else {
            result.message = 'patch=' + patch +' is not a valid json!';
            console.log(result.message);
            if (callback) { callback(result); }
          }
        } else {
          result.message = 'patch=' + patch +' does not exist!';
          console.log(result.message);
          if (callback) { callback(result); }
        }
      });
    }
  }

  /**
   * readDataPatchOrFilePath
   * @param  {string}   patch
   * @param  {Function} callback - {
        success: true|false,
        data: {},
        message: ''
      }
   */
  readDataPatchOrFilePath(patch, callback) {
    let self = this,
      json,
      patchContent,
      result = {
        success: false,
        json: {},
        message: ''
      };

    fs.exists(patch, function (exists) {
        if (exists) {
          console.log('patch=JSON FILE or CSV FILE');
          patchContent = fs.readFileSync(patch).toString();
          result.success = true;
          if (self.validateJson(patchContent)) {
            console.log('patch=JSON');
            json = JSON.parse(patchContent);
            result.data = json;
            result.message = 'patch=' + patch +' is JSON';
            console.log(result.message);
            if (callback) { callback(result); }
          } else {
            console.log('patch=CSV');
            result.data = patchContent;
            result.message = 'patch=' + patch +' is CSV';
            console.log(result.message);
            if (callback) { callback(result); }
          }
        } else {
          result.message = 'patch=' + patch +' does not exist!';
          console.log(result.message);
          if (callback) { callback(result); }
        }
    });
  }

  /**
   * verifyConfPatchJSON
   * @param  {string} validJSON
   * @return {boolean} true|false
   */
  verifyConfPatchJSON(validJSON) {
    if (validJSON.provisioning !== undefined) {
      if (validJSON.provisioning.organizations !== undefined) {
        return true;
      } else { 
        console.log('Missing <ProvisioningJSON>.provisioning.organizations');
        return false;
      }
    } else { 
      console.log('Missing <ProvisioningJSON>.provisioning');
      return false;
    }
  }

}

module.exports = IO;