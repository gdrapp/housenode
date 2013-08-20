var config = require('../config'),
    devices = require('../devices'),
    redis = require('redis'),
    redisClient = redis.createClient(config.redisServer.port, config.redisServer.host, config.redisServer.options),
    redisSubscriber = redis.createClient(config.redisServer.port, config.redisServer.host, config.redisServer.options),
    that = this;

exports.init = function (socketio, cb) {
  that.socketio = socketio;

  redisSubscriber.psubscribe("*");
  redisSubscriber.on("pmessage", function(pattern, channel, message) {
    console.log("Device manager received message %s on channel %s", JSON.stringify(message), channel);
    handleMessage(channel, message);
  });

  cb();
};

exports.devices = function (minDate, cb) {
  redisClient.smembers("devices", function(err, deviceKeys) {
    var deviceList = devices.devices,
        filteredDeviceList = new Array(),
        multi = redisClient.multi();
    
    for (var i=0;i<deviceKeys.length;i++) {
      multi.hgetall(deviceKeys[i]);
    }
    multi.exec(function (err, replies) {
      replies.forEach(function (reply, index) {
        var id = reply.id;
        if (reply.time >= minDate ) {
          var device = deviceList[id];
          for (var attrname in reply) {
            device[attrname] = reply[attrname];
          }
          filteredDeviceList.push(device);
        }
      });

      cb(filteredDeviceList);
    });
  });
};

var handleMessage = function (channel, message) {
  var devicePrefix = "device:";

  for (var id in devices.devices) {
    if (devices.devices[id].source === channel) {
      console.log("Updating device %s state to %s", id, message);

      message = JSON.parse(message);
      message.id = id;

      // Update device in Redis store
      redisClient.hmset(devicePrefix+id, message);
      // Add this device key to the 'devices' list in Redis
      redisClient.sadd("devices", devicePrefix+id);

      redisClient.publish("/device/"+id+"/update", message);

      if (typeof that.socketio !== 'undefined') {
        that.socketio.sockets.emit('device:update', {
          device: message
        });
      } else {
        console.log("SOCKETIO IS UNDEFINED");
      }
    }
  }
};