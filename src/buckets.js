"use strict";

const path = require("path");
const fs = require("fs");
const queue = require("async/queue");
const promisify = require("util").promisify;
const getSize = promisify(require("get-folder-size"));

const stat = promisify(fs.stat);

const listStorageBuckets = (dir, events) => {
  fs.readdir(dir, (err, dirList) => {
    if (err) {
      console.error(err);
    } else {
      Promise.all(
        dirList.map(async file => {
          const copyLock = `.${file}.copy.lock`;
          const deleteLock = `.${file}.delete.lock`;
          const st = await stat(path.join(dir, file));
          if (st.isDirectory()) {
            return {
              name: file,
              created: stat.birthtime,
              isLocked:
                dirList.indexOf(copyLock) >= 0 ||
                dirList.indexOf(deleteLock) >= 0
            };
          }
        })
      )
        .then(buckets => buckets.filter(b => b))
        .then(buckets => events.emit("/buckets", buckets));
    }
  });
};

const getBucketSize = async ({ bucket, events }) => {
  const size = await getSize(bucket.dir);
  events.emit("/size", {
    name: bucket.name,
    size
  });
};

const listBucketSizes = (dir, events, sleepInterval) => {
  const listSizes = () =>
    fs.readdir(dir, (err, dirList) => {
      if (err) {
        console.error(err);
      } else {
        Promise.all(
          dirList.map(async name => {
            const folder = path.join(dir, name);
            const st = await stat(folder);
            return {
              name: name,
              dir: folder,
              isDir: st.isDirectory()
            };
          })
        )
          .then(items => items.filter(f => f.isDir))
          .then(items => items.map(item => q.push({ bucket: item, events })))
          .catch(err =>
            events.emit("/error", {
              action: "get size",
              message: err.message
            })
          );
      }
    });

  const q = queue(getBucketSize, 1);
  q.drain = () => setTimeout(listSizes, sleepInterval);
  listSizes();
};

module.exports = {
  list: (baseDir, events) => bucket => listStorageBuckets(baseDir, events),
  listSizes: listBucketSizes
};
