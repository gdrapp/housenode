var config = require('../config'),
    devices = require('../devices'),
    redis = require('redis'),
    redisClient = redis.createClient(config.redisServer.port, config.redisServer.host, config.redisServer.options),
    redisSubscriber = redis.createClient(config.redisServer.port, config.redisServer.host, config.redisServer.options),
    that = this;

var devicePrefix = "device:";

exports.init = function (socketio, cb) {
  that.socketio = socketio;

  redisSubscriber.psubscribe("*");
  redisSubscriber.on("pmessage", function(pattern, channel, message) {
    console.log("Device manager received message %s on channel %s", JSON.stringify(message), channel);
    handleMessage(channel, message);
  });

  for (var id in devices.devices) {
    redisClient.sadd("devices", devicePrefix+id);
    redisClient.hmset(devicePrefix+id, devices.devices[id]);
    redisClient.hmset(devicePrefix+id, {id: id});

  }

  cb();
};

exports.devices = function (cb) {
  redisClient.smembers("devices", function(err, deviceKeys) {
    var devicesArray = new Array(),
        multi = redisClient.multi();
    
    for (var i=0;i<deviceKeys.length;i++) {
      multi.hgetall(deviceKeys[i]);
    }
    multi.exec(function (err, replies) {
      replies.forEach(function (reply, index) {
        devicesArray.push(reply);
      });

      cb(devicesArray);
    });
  });
};

var handleMessage = function (channel, message) {

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
        that.socketio.sockets.emit('devices:emit', {
          devices: message
        });
      } else {
        console.log("SOCKETIO IS UNDEFINED");
      }
    }
  }
};