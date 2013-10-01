/**
 * Module dependencies
 */

var config = require('./config'),
    express = require('express'),
    db = require('./server/model/db'),
    mongoose = require('mongoose'),
    routes = require('./server/routes'),
    api = require('./server/routes/api'),
    http = require('http'),
    path = require('path'),
    fs = require('fs'),
    util = require('util'),
    redis = require('redis'),
    redisClient = redis.createClient(config.redisServer.port, config.redisServer.host, config.redisServer.options),
    RedisStore = require('connect-redis')(express),
    _ = require('underscore'),
    passport = require('passport'),
    BasicStrategy = require('passport-http').BasicStrategy,
    passportSocketIo = require("passport.socketio"),
    pluginMgr = require('./server/pluginmgr'),
    deviceMgr = require('./server/devicemgr'),
    User = mongoose.model('User');

var dbURI = util.format('mongodb://%s:%s@%s/%s', config.database.username, config.database.password, config.database.host, config.database.db);
db.connect(dbURI, function (err) {
  if (err) { 
    console.log ('ERROR connecting to database: ' + err);
    process.exit();
  } else {
    console.log ('Connected to database');
  }
});

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
    /*if (username == 'testuser' && password == 'testpass') {
      var user = { id:1, firstname:'Test', lastname:'User', username:'testuser' };
      console.log("Authentication successful for %s", username);
      return done(null, user);
    }
    console.log("Authentication failed for %s", username);
    return done(null, false, { message: 'Invalid username or password.' });*/
    User.findOne({ username: username }, function (err, user) {
      console.log("Found user %s", user.username);
      if (err) { console.log("err");return done(err); }
      if (!user) { console.log("!user");return done(null, false); }
      if (!user.authenticate(password)) { console.log("!authenticate");return done(null, false); }
      console.log("other");return done(null, user);
    });    
  }
));

passport.serializeUser(function(user, done) {
  console.log("Serializing user %s", user.username);
  done(null, user.username);
});

passport.deserializeUser(function(username, done) {
  console.log("Deserializing user [%s]", username);
  User.findOne({ username: username }, function (err, user) {
    return done(err, user);
  });    
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
app.get('/session', passport.authenticate('basic'), function(req, res) {
  var signedSession = require('cookie-signature').sign(req.sessionID, config.server.sessionSecret);
  res.end(encodeURIComponent('s:' + signedSession));
});

app.delete('/session', passport.authenticate('basic'), function(req, res) {
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

//app.put('/api/user/:username', api.userPut);
app.put('/api/user/:username', passport.authenticate('basic'), api.userPut);
app.get('/api/user/:username', passport.authenticate('basic'), api.userGet);
app.get('/api/user', passport.authenticate('basic'), api.userGetAll);
app.delete('/api/user/:username', passport.authenticate('basic'), api.userDelete);

app.get('/proxy/:name', passport.authenticate('basic'), routes.proxy);

// Redirect HTML5 controllers to the index (HTML5 history)
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

