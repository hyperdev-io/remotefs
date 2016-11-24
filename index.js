'use strict';

const assert = require('assert');
const restify = require('restify');
const server = restify.createServer();
server.use(restify.bodyParser());

const port = process.env.PORT;
const baseDir = process.env.BASE_DIR;
assert(port, "PORT must be defined");
assert(baseDir, "BASE_DIR must be defined");

const rfs = require('./remotefs')(baseDir);

server.post('/fs/cp', rfs.cp);
server.post('/fs/du', rfs.du);
server.post('/fs/rm', rfs.rm);

server.listen(port, function() {
  return console.log("remotefs listening " + server.url);
});
