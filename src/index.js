"use strict";

const _ = require("lodash");
const EventEmitter2 = require("eventemitter2").EventEmitter2;
const assert = require("assert");
const restify = require("restify");
const server = restify.createServer();
server.use(restify.bodyParser());

const events = new EventEmitter2({ wildcard: true, delimiter: "/" });
const datastore = require("./datastore");
const buckets = require("./buckets");
const remotefs = require("./remotefs");
const mqtt = require("./mqtt");

const port = process.env.PORT;
const baseDir = process.env.BASE_DIR;
const mqttConfig = {
  url: process.env.MQTT_URL,
  username: process.env.MQTT_USER,
  password: process.env.MQTT_PASS
};

module.exports = () => {
  assert(port, "PORT must be defined");
  assert(baseDir, "BASE_DIR must be defined");
  assert(mqttConfig.url, "MQTT_URL must be defined");

  const mqttClient = mqtt.connect(mqttConfig);
  buckets.watch({ path: baseDir }, events);

  const publishBucketsInfo = buckets =>
    mqttClient.publish("/agent/storage/buckets", buckets, { retain: true });
  const listBuckets = _.debounce(buckets.list(baseDir, events, false), 1000);
  events.on("/bucket/**", listBuckets);
  events.on("/buckets/changed", publishBucketsInfo);

  setInterval(buckets.list(baseDir, events), 30000);
  setInterval(
    datastore.publishDataStoreUsage(mqttClient, "/agent/storage/size", baseDir),
    10000
  );

  const rfs = remotefs(baseDir, events);
  server.post("/fs/cp", rfs.cp);
  server.post("/fs/rm", rfs.rm);
  server.post("/fs/mk", rfs.mk);

  server.listen(port, function() {
    return console.log("remotefs listening " + server.url);
  });
};
