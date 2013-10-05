var mongoose = require('mongoose'),
    crypto = require('crypto');

var userSchema = new mongoose.Schema({
  name: {
    first: String,
    last: String
  },
  email: String,
  username: String,
  passwordHash: Buffer,
  passwordSalt: Buffer,
  enabled: { type: Boolean, default: true }
}, {strict: false});

userSchema
  .virtual('name.full')
  .get(function() {
    return this.name.first + ' ' + this.name.last;
  });

userSchema
  .virtual('password')
  .set(function(password) {
    this.passwordSalt = this.makeSalt();
    this.passwordHash = this.hashPassword(password)
  });

userSchema.path('username').validate(function (username) {
  return username.length
}, 'Username cannot be blank');

userSchema.path('passwordHash').validate(function (passwordHash) {
  return passwordHash.length
}, 'Password cannot be blank');

userSchema.methods = {
  authenticate: function (plainText) {
    //console.log('start=%d', (new Date).getTime());
    //var t = this.hashPassword(plainText).toString('hex');
    //var a = this.passwordHash.toString('hex');
    //console.log("T = %s", t);
    //console.log("A = %s", a);
    //console.log("T === A - %s", t===a);
    //console.log('end=%d', (new Date).getTime());
    return this.hashPassword(plainText).toString('hex') === this.passwordHash.toString('hex')
  },

  makeSalt: function () {
    return crypto.randomBytes(256);
  },

  hashPassword: function (password) {
    if (!password) return '';
    return crypto.pbkdf2Sync(password, this.passwordSalt, 10000, 128);
  }
}

var User = mongoose.model('User', userSchema);

