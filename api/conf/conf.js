module.exports = {
  apiServerId: 'newyork-at-digital-ocean',
  apiIp: '104.131.16.251',
  sslKey: './certs/key.pem',
  sslCert: './certs/cert.pem',
  port: 3002,
  httpRequestTimeout: 30000,
  dbConnTimeoutMS: 10000,
  uploadDir: '../middleware/data/uploads/',
  mongooseOptions: {
    server: {
      auto_reconnect: false,
      socketOptions: {
        socketTimeoutMS: 10000
      }
    }
  },
  middlewareWebServiceBasedUrl: 'http://localhost:3010',
  userHomePath: process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'],
  limitJSONPostData: '80mb',
  serverToken: 'c99cba15879bb557275acbf9d425c5f6',
  acceptedClients: {
    ExampleCompany: {
      smtpUser: 'vorachet.jaroensawas@koneksys.com',
      smtpPassword: 'thejesus',
      smtpHost: 'smtp.koneksys.com',
      backend: {
        provisioning: {
          "name": "ExampleCompanyProvisioning",
          "dbPath": "./data",
          "fuseki": {
            "memory": "500M",
            "port" : "3030",
            "user": "admin",
            "password": "password"
          },
          "solr": {
            "memory": "500M",
            "port": "4000",
           },
          "organizations": {
            "ExampleCompany": {
              dataset: 'ExampleCompany'
            }
          }
        }
      },
      oslcImportDir: '../middleware/data/uploads/',
      fusekiQueryUrl: 'http://admin:password@127.0.0.1:3030/ExampleCompanyFulltext/sparql',
      fusekiBaseUrl: 'http://admin:password@127.0.0.1:3030/ExampleCompany',
      solrHost: '127.0.0.1',
      solrPort: '4000',
      dbUrl: {
        local: 'mongodb://localhost:27017/ExampleCompany-local',
        newFeatureReview: 'mongodb://localhost:27017/ExampleCompany-newfeature-review',
        productionMirror: 'mongodb://localhost:27017/ExampleCompany-production-mirror',
        production: 'mongodb://localhost:27017/ExampleCompany-production',
      },
      acceptedClientAdminEmails: {
        ExampleCompany: {
          'poweruser@example.com': {
            authorization: {
              create: true,
              read: true,
              update: true,
              delete: true
            }
          }
        }
      },
      blockedUserEmails: {
        'blocked@example.com': {
          reason: 'there are some reason to block this account'
        }
      },
      importFileProcessor: {
        acceptedFormats: {
          rdfxml: true,
          csv: true,
          n3: true,
          ntriples: true,
          jsonld: true
        }
      }
    }
  }
};
