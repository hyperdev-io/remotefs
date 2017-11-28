const df = require("diskusage").check;

module.exports = {
  publishDataStoreUsage: function(mqtt, topic, dir) {
    return function() {
      df(dir, (err, info) => {
        const total = info.total;
        const used = total - info.available;
        const percentage = Math.round(used / total * 100);
        if (err) {
          mqtt.publish(
            "/errors/remotefs",
            {
              action: "get datastore size",
              message: err.msg
            },
            { retain: false }
          );
        } else {
          mqtt.publish(topic, {
            name: dir,
            total,
            used,
            free: info.available,
            percentage: `${percentage}%`
          });
        }
      });
    };
  }
};
