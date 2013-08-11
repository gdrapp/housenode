var deviceMgr = require('../devicemgr');

exports.devices = function (req, res) {
  var updateTime = req.query.updateTime;
  deviceMgr.devices(updateTime, function (devices) {
    res.json(devices);
  });
};