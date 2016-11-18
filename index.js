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

function resolve(dir) {
  return `${baseDir}${path.resolve(dir)}`;
};

function cp({body: {source, destination}}, res, next) {
  if (source && destination) {
    // path.resolve the parameters to prevent escaping from the base dir with ..
    source = resolve(source);
    destination = resolve(destination);
    child_process.exec(`cp -rp ${source} ${destination}`, (err, out, code) => {
      if (err) {
        console.error(err);
        return next(err);
      } else {
        res.json({
          source: source,
          destination: destination
        });
        return next();
      }
    });
  } else {
    return next(new Error("Both 'source' and 'destination' are required fields"));
  };
};

function du({body: {dir}}, res, next) {
  if (dir) {
    // path.resolve the parameters to prevent escaping from the base dir with ..
    dir = resolve(dir);
    child_process.exec(`du -sb #{dir} | awk '{ print $1 }'`, (err, out, code) => {
      if (err) {
        console.error(err);
        return next(err);
      } else {
        res.json({
          size: parseInt(out)
        });
        return next();
      }
    });
  } else {
    return next(new Error("'dir' is a required field"));
  };
};

server.post('/fs/cp', cp);
server.post('/fs/du', du);

server.listen(port, function() {
  return console.log("remotefs listening " + server.url);
});
