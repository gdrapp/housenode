
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
  var commandPattern = this.channelBase+"/*/"+command;
  redisSubscriber.psubscribe(commandPattern);
  redisSubscriber.on("pmessage", function(pattern, channel, message) {
    if (pattern === commandPattern) {
      if (channel.charAt(0) === '/') {
        // Get rid of the leading slash
        channel = channel.slice(1);
      }
      var target = channel.split('/');
      if (target.length === 5) {
        target = target.slice(3,-1).join('/');
        cb(target, message);
      } else {
        console.warn("Invalid plugin command message channel: " + channel);
      }      
    }
  });
}

module.exports = PluginAPI;
