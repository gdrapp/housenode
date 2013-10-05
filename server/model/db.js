var mongoose = require('mongoose');

exports.connect = function(uri, cb) {
  mongoose.connect(uri, function (err, res) {
    if (err) { 
      cb(err);
    } else {
      cb(null);
    }
  });
}

// If the Node process ends, close the Mongoose connection
process.on('SIGINT', function() {
  mongoose.connection.close(function () {
    console.log('Mongodb connection disconnected through app termination');
    process.exit(0);
  });
});

require('./user');