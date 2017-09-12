"use strict";

const path = require("path");
const fs = require("fs");
const chokidar = require("chokidar");
const shell = require("shelljs");

const listStorageBuckets = (dir, events, includeSizes) => {
  fs.readdir(dir, (err, dirList) => {
    if (err) {
      console.error(er);
    } else {
      const buckets = dirList
        .map(file => {
          const copyLock = `.${file}.copy.lock`;
          const deleteLock = `.${file}.delete.lock`;
          const stat = fs.statSync(path.join(dir, file));
          if (stat.isDirectory()) {
            let bucket = {
              name: file,
              created: stat.birthtime,
              isLocked:
                dirList.indexOf(copyLock) >= 0 ||
                dirList.indexOf(deleteLock) >= 0
            };
            if (includeSizes) {
              bucket.size = parseInt(
                shell.exec(
                  `du -sb ${path.join(dir, file)} | awk '{ print $1 }'`,
                  { silent: true }
                )
              );
            }
            return bucket;
          }
        })
        .filter(b => b);
      events.emit("/buckets/changed", buckets);
    }
  });
};

module.exports = {
  list: (baseDir, events, includeSizes = true) => {
    return bucket => {
      return listStorageBuckets(baseDir, events, includeSizes);
    };
  },
  watch: (config, events) => {
    function emit(eventType) {
      return function(file) {
        events.emit(eventType, { name: path.parse(file).base });
      };
    }
    const watchOpts = { ignored: path.join(config.path, "/*/**") };
    const watchDir = chokidar.watch(config.path, watchOpts);
    watchDir.on("addDir", emit("/bucket/added"));
    watchDir.on("unlinkDir", emit("/bucket/removed"));

    const watchLockFiles = chokidar.watch(
      path.join(config.path, "/.*.lock"),
      watchOpts
    );
    watchLockFiles.on("add", emit("/bucket/lock/added"));
    watchLockFiles.on("unlink", emit("/bucket/lock/removed"));
  }
};
