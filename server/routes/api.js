var mongoose = require('mongoose'),
    User = mongoose.model('User');

var deviceMgr = require('../devicemgr');

exports.devices = function (req, res) {
  var updateTime = req.query.updateTime;
  deviceMgr.devices(updateTime, function (devices) {
    res.json(devices);
  });
};

exports.userPut = function (req, res) {
  User.create(req.body, function(err, user) {
    if (err) {
      res.writeHeader(400, {
        'Content-Type': 'application/json'
      });
      res.write(JSON.stringify({'status':'error', 'description': err}));
    } else {
      res.writeHeader(200, {
        'Content-Type': 'application/json'
      });
      res.write(JSON.stringify({'status':'ok'}));
    }
    res.end();      
  });
}

exports.userGet = function (req, res) {

}

exports.userGetAll = function (req, res) {

}

exports.userDelete = function (req, res) {

}
