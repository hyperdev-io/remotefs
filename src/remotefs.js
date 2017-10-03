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

function cp(baseDir, logger) {
  return function({ source, destination }) {
    if (source && destination) {
      source = resolve(baseDir, source);
      destination = resolve(baseDir, destination);
      const lockFileSrc = getLockFile(baseDir, source, "copy");
      const lockFileDest = getLockFile(baseDir, destination, "copy");
      logger.log(`Copying ${source} to ${destination}`);
      shell.exec(
        `mkdir ${destination}; touch ${lockFileSrc} ${lockFileDest}`,
        err => {
          if (err) return logger.error(err);
          shell.exec(`cp -rp ${source}/. ${destination}`, err => {
            if (err) return logger.error(err);
            shell.exec(`rm ${lockFileSrc} ${lockFileDest}`, logger.error);
          });
        }
      );
    } else {
      logger.error("Both 'source' and 'destination' are required fields");
    }
  };
}

function rm(baseDir, logger) {
  return function({ name }) {
    if (name) {
      const dir = resolve(baseDir, name);
      const lockFile = getLockFile(baseDir, name, "delete");
      logger.log(`Deleting ${dir}`);
      shell.exec(`touch ${lockFile}`, err => {
        if (err) return logger.error(err);
        shell.exec(`rm -rf ${dir}`, err => {
          if (err) return logger.error(err);
          shell.exec(`rm ${lockFile}`, logger.error);
        });
      });
    } else {
      logger.error("'name' is a required field");
    }
  };
}

function mk(baseDir, logger) {
  return function({ name }) {
    if (name) {
      const dir = resolve(baseDir, name);
      logger.log(`Creating ${dir}`);
      shell.exec(`mkdir ${dir}`, logger.error);
    } else {
      logger.error("'name' is a required field");
    }
  };
}

module.exports = function(baseDir, events) {
  function logger(action) {
    return {
      log: message => {
        console.log(message);
        events.emit("/log", { action, message });
      },
      error: message => {
        if (message) {
          console.error(message);
          events.emit("/error", { action, message });
        }
      }
    };
  }

  return {
    cp: cp(baseDir, logger("copy bucket")),
    rm: rm(baseDir, logger("delete bucket")),
    mk: mk(baseDir, logger("create bucket"))
  };
};
