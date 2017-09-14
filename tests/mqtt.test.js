const td = require("testdouble");

const mqttConfig = {
  url: "mqtt://mqtt.test.server:8883",
  username: "test-user",
  password: "test-pass"
};

describe("MQTT Connect", () => {
  let _mqtt = null;
  let mqtt = null;
  let client = null;

  beforeEach(() => {
    _mqtt = td.replace("mqtt");
    client = {
      on: td.function(".on"),
      publish: td.function(".publish")
    };
    td.when(_mqtt.connect(mqttConfig.url, mqttConfig)).thenReturn(client);
    mqtt = require("../src/mqtt");
  });

  afterEach(td.reset);

  it("should invoke mqtt.js connect with the correct config", () => {
    mqtt.connect(mqttConfig);
    td.verify(client.on("connect", td.matchers.isA(Function)));
    td.verify(client.on("error", td.matchers.isA(Function)));
    td.verify(client.on("close", td.matchers.isA(Function)));
  });

  it("should return a publish function", () => {
    const mc = mqtt.connect(mqttConfig);
    mc.publish("/my/topic", { some: "data" });
    td.verify(client.publish("/my/topic", JSON.stringify({ some: "data" })));
  });
});
