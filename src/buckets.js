"use strict";

const path = require("path");
const fs = require("fs");
const getSize = require("get-folder-size");

const listStorageBuckets = (dir, events) => {
  fs.readdir(dir, (err, dirList) => {
    if (err) {
      console.error(err);
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
            return bucket;
          }
        })
        .filter(b => b);
      events.emit("/buckets", buckets);
    }
  });
};

const listBucketSizes = (dir, events) => {
  fs.readdir(dir, (err, dirList) => {
    if (err) {
      console.error(err);
    } else {
      const buckets = dirList.map(name => {
        const folder = path.join(dir, name);
        const stat = fs.statSync(folder);
        if (stat.isDirectory()) {
          getSize(folder, function(err, size) {
            if (err) {
              events.emit("/error", {
                action: "get size",
                message: err.message
              });
            } else {
              events.emit("/size", {
                name,
                size
              });
            }
          });
        }
      });
    }
  });
};

module.exports = {
  list: (baseDir, events) => bucket => listStorageBuckets(baseDir, events),
  listSizes: (baseDir, events) => bucket => listBucketSizes(baseDir, events)
};
