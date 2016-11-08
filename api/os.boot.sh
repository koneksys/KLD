service apache2 start
service mongod start

cd /opt/kld-api
forever start server.js
cd /opt/kld-middleware
forever start server.js