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

function exec(cmd, next, callback) {
  child_process.exec(cmd, (err, out, code) => {
    if (err) {
      console.error(err);
      return next(err);
    } else {
      callback(out, code);
      return next();
    }
  });
}

function cp({body: {source, destination}}, res, next) {
  if (source && destination) {
    // path.resolve the parameters to prevent escaping from the base dir with ..
    source = resolve(source);
    destination = resolve(destination);
    exec(`cp -rp ${source} ${destination}`, next, () => {
      res.json({
        source: source,
        destination: destination
      });
    });
  } else {
    return next(new Error("Both 'source' and 'destination' are required fields"));
  };
};

function du({body: {dir}}, res, next) {
  if (dir) {
    // path.resolve the parameters to prevent escaping from the base dir with ..
    dir = resolve(dir);
    exec(`du -sb ${dir} | awk '{ print $1 }'`, next, (out) => {
      res.json({
        size: parseInt(out)
      });
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
