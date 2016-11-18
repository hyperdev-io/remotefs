'use strict';

const child_process = require('child_process');
const path = require('path');
const assert = require('assert');
const restify = require('restify');
const server = restify.createServer();
server.use(restify.bodyParser());

const port = process.env.PORT;
const baseDir = process.env.BASE_DIR;
assert(port, "PORT must be defined");
assert(baseDir, "BASE_DIR must be defined");

copy = function(req, res, next) {
  const source = req.body.source;
  const destination = req.body.destination;
  if (!(source && destination)) {
    return next(new Error("Both source and destination are required fields"));
  } else {
    return child_process.exec("cp -rp " + source + " " + destination, function(err, out, code) {
      if (err) {
        console.error(err);
        return next(err);
      } else {
        res.json(req.body);
        return next();
      }
    });
  }
};

server.post('/fs/cp', copy);

server.listen(port, function() {
  return console.log("remotefs listening " + server.url);
});
