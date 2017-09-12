"use strict";

const mqtt = require("mqtt");

const _connect = (mqttConfig, console) => {
  console.log("MQTT: Connecting...", mqttConfig);
  const client = mqtt.connect(mqttConfig.url, mqttConfig);
  client.on("connect", function() {
    console.log("MQTT: Connected to", mqttConfig.url);
  });
  client.on("error", function(err) {
    console.error("MQTT: An error occured", err);
  });
  client.on("close", function() {
    console.log("MQTT: Connection closed");
  });
  return {
    publish: (topic, data) => {
      return client.publish(topic, JSON.stringify(data));
    }
  };
};

module.exports = {
  connect: mqttConfig => {
    return _connect(mqttConfig, console);
  }
};
