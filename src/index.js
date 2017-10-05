"use strict";

const _ = require("lodash");
const EventEmitter2 = require("eventemitter2").EventEmitter2;
const assert = require("assert");
const mqtt = require("@bigboat/mqtt-client");

const events = new EventEmitter2({ wildcard: true, delimiter: "/" });
const datastore = require("./datastore");
const buckets = require("./buckets");
const remotefs = require("./remotefs");

module.exports = () => {
  const baseDir = process.env.BASE_DIR;
  const listBucketsInterval = process.env.LIST_BUCKETS_INTERVAL || 2000;
  const getBucketSizesInterval = process.env.GET_BUCKET_SIZES_INTERVAL || 15000;
  const getDatastoreSizeInterval =
    process.env.GET_DATASTORE_SIZE_INTERVAL || 5000;

  assert(baseDir, "BASE_DIR must be defined");

  const rfs = remotefs(baseDir, events);
  const mqttClient = mqtt();
  mqttClient.on("connect", () => {
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
      datastore.publishDataStoreUsage(
        mqttClient,
        "/agent/storage/size",
        baseDir
      ),
      getDatastoreSizeInterval
    );

    const publishMessage = (topic, msg) =>
      mqttClient.publish(topic, msg, { retain: false });
    events.on("/error", msg => publishMessage("/errors/remotefs", msg));
    events.on("/log", msg => publishMessage("/logs/remotefs", msg));

    const subs = {
      "/commands/remotefs/create": rfs.mk,
      "/commands/remotefs/copy": rfs.cp,
      "/commands/remotefs/delete": rfs.rm
    };
    mqttClient.addSubscriptions(subs, { qos: 2 });
  });
};
