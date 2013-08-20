
var config = require('../../config'),
    redis = require('redis'),
    redisClient = redis.createClient(config.redisServer.port, config.redisServer.host, config.redisServer.options),
    redisSubscriber = redis.createClient(config.redisServer.port, config.redisServer.host, config.redisServer.options);

redisClient.on("error", function (err) {
    console.log("REDIS ERROR: " + err);
});

function PluginAPI(pluginName, pluginInstance) {
  this.pluginName = pluginName;
  this.pluginInstance = pluginInstance;

  this.channelBase = "/plugin/"+this.pluginName+"/"+this.pluginInstance;
}

PluginAPI.prototype.publishValue = function(valueId, value) {
  var message = { value: value,
                  time: new Date().getTime() };
  message = JSON.stringify(message);
  redisClient.publish(this.channelBase+"/"+valueId, message);
}

PluginAPI.prototype.onCommand = function(command, cb) {
  redisSubscriber.psubscribe(this.channelBase+"/*/"+command);
  redisSubscriber.on("pmessage", function(pattern, channel, message) {
    var target = channel.split('/');
    if (target.length === 5) {
      target = target.slice(3,-1);
      var args = {};
      if (message && message.length > 0) {
        args = JSON.parse(message);        
      }
      cb(target, args);
    } else {
      console.warn("Invalid plugin command message channel: " + channel);
    }
  });
}

module.exports = PluginAPI;
