"use strict";

const child_process = require("child_process");
const path = require("path");
const shell = require("shelljs");

function resolve(baseDir, dir) {
  return path.join(baseDir, path.parse(dir).base);
}

function getLockFile(baseDir, bucket, op) {
  return path.join(baseDir, `.${path.parse(bucket).base}.${op}.lock`);
}

function handleError(err, next) {
  console.error(err);
  return next(new Error(err));
}

function cp(baseDir) {
  return function({ body: { source, destination } }, res, next) {
    if (source && destination) {
      source = resolve(baseDir, source);
      destination = resolve(baseDir, destination);
      const lockFileSrc = getLockFile(baseDir, source, "copy");
      const lockFileDest = getLockFile(baseDir, destination, "copy");
      shell.exec(
        `mkdir ${destination}; touch ${lockFileSrc} ${lockFileDest}`,
        err => {
          if (err) return handleError(err, next);
          shell.exec(`cp -rp ${source}/. ${destination}`, err => {
            if (err) return handleError(err, next);
            shell.exec(`rm ${lockFileSrc} ${lockFileDest}`, err => {
              if (err) return handleError(err, next);
            });
          });
        }
      );
      res.send("OK");
      return next();
    } else {
      return handleError(
        "Both 'source' and 'destination' are required fields",
        next
      );
    }
  };
}

function rm(baseDir) {
  return function({ body: { name } }, res, next) {
    if (name) {
      const dir = resolve(baseDir, name);
      const lockFile = getLockFile(baseDir, name, "delete");
      shell.exec(`touch ${lockFile}`, err => {
        if (err) return handleError(err, next);
        shell.exec(`rm -rf ${dir}`, err => {
          if (err) return handleError(err, next);
          shell.exec(`rm ${lockFile}`, err => {
            if (err) return handleError(err, next);
          });
        });
      });
      res.send("OK");
      return next();
    } else {
      return handleError("'name' is a required field", next);
    }
  };
}

function mk(baseDir) {
  return function({ body: { name } }, res, next) {
    if (name) {
      const dir = resolve(baseDir, name);
      shell.exec(`mkdir ${dir}`, err => {
        if (err) return handleError(err, next);
        res.send("OK");
        return next();
      });
    } else {
      return handleError("'name' is a required field", next);
    }
  };
}

module.exports = function(baseDir) {
  return {
    cp: cp(baseDir),
    rm: rm(baseDir),
    mk: mk(baseDir)
  };
};
