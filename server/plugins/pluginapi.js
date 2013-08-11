
var config = require('../../config'),
    redis = require('redis'),
    redisClient = redis.createClient(config.redisServer.port, config.redisServer.host, config.redisServer.options),
    redisSubscriber = redis.createClient(config.redisServer.port, config.redisServer.host, config.redisServer.options);

redisClient.on("error", function (err) {
    console.log("REDIS ERROR: " + err);
});

/*exports.publishValue = function(pluginName, pluginInstance, valueId, value) {
  var message = { value: value,
                  time: new Date().getTime() };
  message = JSON.stringify(message);
  redisClient.publish("/plugin/"+pluginName+"/"+pluginInstance+"/"+valueId, message);
};*/


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
  redisSubscriber.subscribe(this.channelBase+"/command/"+command, function (channel, message) {
    cb(message);
  });
}

module.exports = PluginAPI;
