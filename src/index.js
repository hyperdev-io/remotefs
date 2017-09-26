"use strict";

const _ = require("lodash");
const EventEmitter2 = require("eventemitter2").EventEmitter2;
const assert = require("assert");
const restify = require("restify");
const mqtt = require("bigboat-mqtt-client");
const server = restify.createServer();
server.use(restify.bodyParser());

const events = new EventEmitter2({ wildcard: true, delimiter: "/" });
const datastore = require("./datastore");
const buckets = require("./buckets");
const remotefs = require("./remotefs");

module.exports = () => {
  const port = process.env.PORT;
  const baseDir = process.env.BASE_DIR;
  const listBucketsInterval = process.env.LIST_BUCKETS_INTERVAL || 2000;
  const getBucketSizesInterval = process.env.GET_BUCKET_SIZES_INTERVAL || 30000;
  const getDatastoreSizeInterval =
    process.env.GET_DATASTORE_SIZE_INTERVAL || 10000;

  assert(port, "PORT must be defined");
  assert(baseDir, "BASE_DIR must be defined");

  const mqttClient = mqtt();
  buckets.watch({ path: baseDir }, events);

  const publishBucketsInfo = buckets =>
    mqttClient.publish("/agent/storage/buckets", buckets, { retain: true });
  const listBuckets = _.debounce(
    buckets.list(baseDir, events, false),
    listBucketsInterval
  );
  events.on("/bucket/**", listBuckets);
  events.on("/buckets/changed", publishBucketsInfo);

  setInterval(buckets.list(baseDir, events), getBucketSizesInterval);
  setInterval(
    datastore.publishDataStoreUsage(mqttClient, "/agent/storage/size", baseDir),
    getDatastoreSizeInterval
  );

  const rfs = remotefs(baseDir, events);
  server.post("/fs/cp", rfs.cp);
  server.post("/fs/rm", rfs.rm);
  server.post("/fs/mk", rfs.mk);

  server.listen(port, function() {
    return console.log("remotefs listening " + server.url);
  });
};
