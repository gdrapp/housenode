/**
 * Module dependencies
 */

var config = require('./config'),
    express = require('express'),
    routes = require('./server/routes'),
    api = require('./server/routes/api'),
    http = require('http'),
    path = require('path'),
    fs = require('fs'),
    redis = require('redis'),
    redisClient = redis.createClient(config.redisServer.port, config.redisServer.host, config.redisServer.options),
    RedisStore = require('connect-redis')(express),
    _ = require('underscore'),
    passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    BasicStrategy = require('passport-http').BasicStrategy,
    passportSocketIo = require("passport.socketio"),
    pluginMgr = require('./server/pluginmgr'),
    deviceMgr = require('./server/devicemgr');


var app = module.exports = express();

if (config.server.sslKey && config.server.sslCert)
{
  var serverOptions = {
    key: fs.readFileSync(config.server.sslKey),
    cert: fs.readFileSync(config.server.sslCert),
    ca: fs.readFileSync(config.server.sslCA)
  };
  console.log("Creating HTTPS server");
  var server = require('https').createServer(serverOptions, app);  
} else {
  console.warn("WARNING: Creating HTTP server, DATA WILL NOT BE ENCRYPTED!");
  var server = require('http').createServer(app);  
}

var socketio = require('socket.io').listen(server);
var redisSessionStore = new RedisStore({ client: redisClient });

/**
 * Module dependencies
 */
 exports.socketio = socketio;

/**
 * Authentication Configuration
 */

passport.use(new BasicStrategy(
  function(username, password, done) {
    console.log("Attempting to authenticate user %s", username);
    if (username == 'testuser' && password == 'testpass') {
      var user = { id:1, firstname:'Test', lastname:'User', username:'testuser' };
      console.log("Authentication successful for %s", username);
      return done(null, user);
    }
    console.log("Authentication failed for %s", username);
    return done(null, false, { message: 'Invalid username or password.' });    
  }
));

passport.serializeUser(function(user, done) {
  console.log("Serializing user with id %d", user.id);
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  var user = {id:1, firstname:'Test', lastname:'User', username:'testuser'};
  console.log("Deserializing user [%s]", user);
  done(null, user);
});

socketio.set("authorization", passportSocketIo.authorize({
  cookieParser: express.cookieParser,
  key: 'express.sid',
  secret: config.server.sessionSecret,
  store: redisSessionStore,
  fail: function(data, accept) {
    console.log("Socket.IO authentication failure");
    accept(null, false);
  },
  success: function(data, accept) {
    console.log("Socket.IO authentication success");
    accept(null, true);
  }
}));

/**
 * Express Configuration
 */

// All environments
app.set('port', config.server.port);
app.set('views', path.join(__dirname, 'server', 'views'));
app.set('view engine', 'jade');

app.use(express.logger('dev'));
app.use(express.cookieParser());
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.session({ store: redisSessionStore, secret: config.server.sessionSecret, key: 'express.sid' }));
app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);

// Include static content.  This must be after app.router for security to work on these files!
app.use(express.static(path.join(__dirname, 'public')));

// Development only
if (app.get('env') === 'development') {
  app.use(express.errorHandler());
}

// Production only
if (app.get('env') === 'production') {
  // TODO
}

// Load the device manager
deviceMgr.init(socketio, function() {
  console.info("Device manager initialized");
});

// Load all of the app's custom plugins
pluginMgr.loadPlugins(function() {
  console.info("Plugins loaded");

  pluginMgr.initPlugins(function() {
    console.info("Plugins initialized");
  });
});

/**
 * Routes
 */

// Returns the current session ID for use with non-browser socket.io requests
app.get('/getSession', passport.authenticate('basic'), function(req, res) {
  var signedSession = require('cookie-signature').sign(req.sessionID, config.server.sessionSecret);
  res.end(encodeURIComponent('s:' + signedSession));
});

app.get('/destroySession', passport.authenticate('basic'), function(req, res) {
  redisSessionStore.destroy(req.sessionID, function() {
    console.log("Session destroyed [%s]", req.sessionID);
    res.end('ok');
  });
});

// Serve index and view partials
app.get('/', passport.authenticate('basic'), routes.index);
app.get('/partials/:name', passport.authenticate('basic'), routes.partials);

// JSON API
app.get('/api/devices', passport.authenticate('basic'), api.devices);

app.get('/proxy/:name', passport.authenticate('basic'), routes.proxy);

// Redirect HTML5 controllers paths to the index (HTML5 history)
app.get('/devices', passport.authenticate('basic'), routes.index);
app.get('/cameras', passport.authenticate('basic'), routes.index);
app.get('/admin', passport.authenticate('basic'), routes.index);
app.get('/about', passport.authenticate('basic'), routes.index);

// Required to secure static content
app.all('*', passport.authenticate('basic'));

// Socket.io Communication
socketio.sockets.on('connection', function(socket) {
  // Join a room based on this session ID
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

