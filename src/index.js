"use strict";

const _ = require("lodash");
const EventEmitter2 = require("eventemitter2").EventEmitter2;
const assert = require("assert");
const mqtt = require("@bigboat/mqtt-client");

const events = new EventEmitter2({ wildcard: true, delimiter: "/" });
const datastore = require("./datastore");
const buckets = require("./buckets");
const remotefs = require("./remotefs");

const addCommandSubscriptions = (mqtt, rfs) => {
  const subs = {
    "/commands/storage/bucket/create": rfs.mk,
    "/commands/storage/bucket/copy": rfs.cp,
    "/commands/storage/bucket/delete": rfs.rm
  };
  mqtt.subscribe("/commands/storage/#", { qos: 2 });
  mqtt.on(
    "message",
    (topic, msg) => subs[topic] && subs[topic](JSON.parse(msg))
  );
};

const addLogging = mqtt => {
  const publishMessage = (topic, msg) =>
    mqtt.publish(topic, msg, { retain: false });
  events.on("/error", msg => publishMessage("/errors/storage", msg));
  events.on("/log", msg => publishMessage("/logs/storage", msg));
};

const watchBuckets = (baseDir, listBucketsInterval, mqtt, events) => {
  const publishBucketsInfo = buckets =>
    mqtt.publish("/agent/storage/buckets", buckets, { retain: true });
  events.on("/buckets", publishBucketsInfo);
  setInterval(buckets.list(baseDir, events), listBucketsInterval);
};

const watchBucketSizes = (baseDir, getBucketSizesInterval, mqtt, events) => {
  events.on("/size", data => mqtt.publish("/agent/storage/bucket/size", data));
  buckets.listSizes(baseDir, events, getBucketSizesInterval);
};

module.exports = () => {
  const baseDir = process.env.BASE_DIR;
  const listBucketsInterval = process.env.LIST_BUCKETS_INTERVAL || 5000;
  const getBucketSizesInterval = process.env.GET_BUCKET_SIZES_INTERVAL || 30000;
  const getDatastoreSizeInterval =
    process.env.GET_DATASTORE_SIZE_INTERVAL || 5000;

  assert(baseDir, "BASE_DIR must be defined");

  const rfs = remotefs(baseDir, events);
  const mqttClient = mqtt();

  addLogging(mqttClient);
  addCommandSubscriptions(mqttClient, rfs);

  watchBuckets(baseDir, listBucketsInterval, mqttClient, events);
  watchBucketSizes(baseDir, getBucketSizesInterval, mqttClient, events);

  setInterval(
    datastore.publishDataStoreUsage(mqttClient, "/agent/storage/size", baseDir),
    getDatastoreSizeInterval
  );
};
