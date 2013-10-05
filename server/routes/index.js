/*
 * GET home page.
 */

var http = require('http'),
    devicemgr = require('../devicemgr');

var config = require('../../config');

exports.index = function(req, res){
  res.render('index');
};

exports.login = function(req, res){
  res.render('login', { message: req.flash('error') });
};

exports.loggedin = function(req, res){
  res.send(req.isAuthenticated() ? req.user : '0');
};

exports.logout = function(req, res){
  console.log('Logging out user: %s', req.user.username);
  req.logOut();
  res.redirect('/login');
};

exports.partials = function (req, res) {
  var name = req.params.name;
  res.render('partials/' + name);
};

exports.mjpegcamProxy = function (req, res) {
  var deviceId = req.params.deviceId;
  var pathType = req.params.pathType;
  console.log("Received mjpegcamProxy request for device " + deviceId);

  if (deviceId && pathType) {
    devicemgr.device(deviceId, function(device) {
      if (device && (typeof device.hostname !== 'undefined') && (typeof device[pathType] !== 'undefined')) {
        req.pause();
        
        var host = device.hostname.split(':');

        var options = {
          "hostname": host[0],
          "port": host[1] | 80,
          "path": device[pathType],
          "method": "GET"
        }

        res.on('close', function() {
          console.log('Aborting proxy back end stream');
          backendReq.abort();
        });

        console.log("Creating http request with the following options: " + JSON.stringify(options));
        var backendReq = http.request(options, function(backendRes) {
          backendRes.pause();
          res.writeHeader(backendRes.statusCode, backendRes.headers);
          backendRes.pipe(res);
          backendRes.resume();
        });

        backendReq.on('error', function(e) {
          console.log('problem with request: ' + e.message);
        });
        req.pipe(backendReq);
        req.resume();
      } else {
        res.status(404).send("Not found");
      }
    });
  } else {
    res.status(400).send("Error");
  }
}

exports.proxy = function (req, res) {
  var name = req.params.name;
  console.log("Received proxy request for " + name);

  if (name in config.proxy) {
    req.pause();
  
    var options = config.proxy[name].http_options;

    res.on('close', function() {
      console.log('Aborting proxy back end stream');
      backendReq.abort();
    });

    console.log("Creating http request with the following options: " + JSON.stringify(options));
    var backendReq = http.request(options, function(backendRes) {
      backendRes.pause();
      res.writeHeader(backendRes.statusCode, backendRes.headers);
      backendRes.pipe(res);
      backendRes.resume();
    });

    backendReq.on('error', function(e) {
      console.log('problem with request: ' + e.message);
    });
    req.pipe(backendReq);
    req.resume();
  } else {
    res.status(404).send("Not found");
  }
};