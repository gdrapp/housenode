/**
 * Module dependencies
 */

var config = require('./config'),
    express = require('express'),
    routes = require('./server/routes'),
    api = require('./server/routes/api'),
    http = require('http'),
    path = require('path'),
    redis = require('redis'),
    redisClient = redis.createClient(config.redisServer.port, config.redisServer.host, config.redisServer.options),
    _ = require('underscore'),
    pluginMgr = require('./server/pluginmgr'),
    deviceMgr = require('./server/devicemgr');

var app = module.exports = express();
var server = require('http').createServer(app);
var socketio = require('socket.io').listen(server);

/**
 * Module dependencies
 */
 exports.socketio = socketio;


/**
 * Configuration
 */

// all environments
app.set('port', config.server.port);
app.set('views', path.join(__dirname, 'server', 'views'));
app.set('view engine', 'jade');
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.static(path.join(__dirname, 'public')));
app.use(app.router);

// development only
if (app.get('env') === 'development') {
  app.use(express.errorHandler());
}

// production only
if (app.get('env') === 'production') {
  // TODO
}

// load the device manager
deviceMgr.init(socketio, function() {
  console.info("Device manager initialized");
});

// load all of the app's custom plugins
pluginMgr.loadPlugins(function() {
  console.info("Plugins loaded");

  pluginMgr.initPlugins(function() {
    console.info("Plugins initialized");
  });
});

/**
 * Routes
 */

// serve index and view partials
app.get('/', routes.index);
app.get('/partials/:name', routes.partials);

// JSON API
app.get('/api/devices', api.devices);

app.get('/proxy/:name', routes.proxy);

// redirect all others to the index (HTML5 history)
app.get('*', routes.index);


// Socket.io Communication
socketio.sockets.on('connection', function(socket) {
  // join a room based on this session ID
  socket.join(socket.handshake.sessionID);

  socket.on('locations:get', function() {
    deviceMgr.devices(function (devices) {
      var locations = _.uniq(_.pluck(devices, 'location').sort(), true);
      socket.emit('locations:emit', {
        locations: locations,
        isAllLocations: true
      });
    });
  });

  socket.on('devices:get', function() {
    deviceMgr.devices(function (devices) {
      socket.emit('devices:emit', {
        devices: devices,
        isAllDevices: true
      });
    });
  });

  socket.on('plugins:get', function(data) {
    var pluginInfo = new Array();
    for (var key in pluginMgr.pluginModules) {
      pluginInfo.push(pluginMgr.pluginModules[key].info);
    }
    socket.emit('plugins:emit', {
      plugins: pluginInfo
    });
  });

  socket.on('system:event', function(data) {
    console.log("Publishing event " + data.event);
    redisClient.publish(data.event, data.message);
  });
});

 /**
 * Start Server
 */

server.listen(app.get('port'), function () {
	console.log('Express server listening on port ' + app.get('port'));
});

