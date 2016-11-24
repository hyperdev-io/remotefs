'use strict'

const child_process = require('child_process');
const path = require('path');

function resolve(baseDir, dir) {
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

function cp(baseDir) {
  return function({body: {source, destination}}, res, next) {
    if (source && destination) {
      // path.resolve the parameters to prevent escaping from the base dir with ..
      source = resolve(baseDir, source);
      destination = resolve(baseDir, destination);
      exec(`cp -rp ${source} ${destination}`, next, () => {
        res.json({
          source,
          destination
        });
      });
    } else {
      return next(new Error("Both 'source' and 'destination' are required fields"));
    };
  };
};

function du(baseDir) {
  return function({body: {dir}}, res, next) {
    if (dir) {
      // path.resolve the parameters to prevent escaping from the base dir with ..
      dir = resolve(baseDir, dir);
      exec(`du -sb ${dir} | awk '{ print $1 }'`, next, (out) => {
        res.json({
          size: parseInt(out)
        });
      });
    } else {
      return next(new Error("'dir' is a required field"));
    };
  };
};

function rm(baseDir) {
  return function({body: {dir}}, res, next) {
    if (dir) {
      // path.resolve the parameters to prevent escaping from the base dir with ..
      dir = resolve(baseDir, dir);
      exec(`rm -rf ${dir}`, next, () => {
        res.json({
          dir
        });
      });
    } else {
      return next(new Error("'dir' is a required field"));
    };
  };
};

module.exports = function(baseDir) {
  return {
    cp: cp(baseDir),
    du: du(baseDir),
    rm: rm(baseDir)
  };
};
