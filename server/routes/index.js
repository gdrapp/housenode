/*
 * GET home page.
 */

var http = require('http');
var config = require('../../config');

exports.index = function(req, res){
  res.render('index');
};

exports.partials = function (req, res) {
  var name = req.params.name;
  res.render('partials/' + name);
};

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