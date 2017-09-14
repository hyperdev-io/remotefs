const shell = require("shelljs");

module.exports = {
  publishDataStoreUsage: function(mqtt, topic, dir) {
    return function() {
      const res = shell.exec(
        `df -B1 ${dir} | tail -1 | awk '{ print $2 }{ print $3}{ print $5}'`,
        { silent: true },
        (code, stdout, stderr) => {
          if (code != 0) {
            console.error("Error while retrieving data store size", err);
          } else {
            const total = stdout.split("\n")[0];
            const used = stdout.split("\n")[1];
            const percentage = stdout.split("\n")[2];
            mqtt.publish(topic, {
              name: dir,
              total,
              used,
              percentage
            });
          }
        }
      );
    };
  }
};
