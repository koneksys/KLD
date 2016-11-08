import angular from 'angular';
import notificationManagerService from './notificationManager.service';

var CryptoJS = require('crypto-js');
var CryptoJsonFormatter = {
  stringify: function (cipherParams) {
    var jsonObj = {
      ct: cipherParams.ciphertext.toString(CryptoJS.enc.Base64)
    };

    if (cipherParams.iv) {
      jsonObj.iv = cipherParams.iv.toString();
    }
    if (cipherParams.salt) {
      jsonObj.s = cipherParams.salt.toString();
    }
    return JSON.stringify(jsonObj);
  },
  parse: function (jsonStr) {
    var jsonObj = JSON.parse(jsonStr);
    var cipherParams = CryptoJS.lib.CipherParams.create({
      ciphertext: CryptoJS.enc.Base64.parse(jsonObj.ct)
    });

    if (jsonObj.iv) {
      cipherParams.iv = CryptoJS.enc.Hex.parse(jsonObj.iv);
    }
    if (jsonObj.s) {
      cipherParams.salt = CryptoJS.enc.Hex.parse(jsonObj.s);
    }
    return cipherParams;
  }
};

class SessionManager {
  constructor($window, $location, store, apiManagerService, notificationManagerService) {
    this.window = $window;
    this.location = $location;
    this.store = store;
    this.notifier = notificationManagerService;
    this.key = '85CE6CCF67FBBAA8BB13479C3A6E084F';
  }

  set(objectKey, instance) {
    if (objectKey === 'token') {
      this.store.set(objectKey, instance);
    } else {
      this.store.set(objectKey, this.encrypt(instance));
    }
  }

  get(objectKey) {
    let data, encryptedData;

    if (objectKey === 'token') {
      return this.store.get(objectKey);
    }

    encryptedData = this.store.get(objectKey);
    if (encryptedData === undefined) {
      // this.remove('profile');
      // this.remove('token');
      // this.remove('org');
      // this.window.location = '/';
      return null;
    }

    data = this.decrypt(encryptedData);
    if (data === undefined) {
      // this.remove('profile');
      // this.remove('token');
      // this.remove('org');
      // this.window.location = '/';
      return null;
    }

    return this.decrypt(this.store.get(objectKey));
  }

  remove(objectKey) {
    this.store.remove(objectKey);
  }

  encrypt(json) {
    try {
      return JSON.parse(CryptoJS.AES.encrypt(JSON.stringify(json),
        this.key, { format: CryptoJsonFormatter }).toString());
    } catch (error) {
      // alert('ENCRYPT: ' + error.toString());
    }
  }

  decrypt(encryptedFromServerJSON) {
    try {
      let decryptedFromServerText = CryptoJS.enc.Utf8.stringify(
          CryptoJS.AES.decrypt(JSON.stringify(encryptedFromServerJSON), this.key, { format: CryptoJsonFormatter })
          );

      return JSON.parse(decryptedFromServerText);
    } catch (error) {
      // alert('DECRYPT: Invalid token');
    }
  }
}

SessionManager.$inject = ['$window', '$location', 'store', 'notificationManagerService'];

export default angular.module('services.session-manager', [notificationManagerService])
  .service('sessionManagerService', SessionManager)
  .name;
