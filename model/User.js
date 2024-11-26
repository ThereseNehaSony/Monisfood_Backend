const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  mobileNumber: { type: String,  },
  email: { type: String, },
  name: { type: String, },
  address: { type: String },
  password: { type: String },
  otp: { type: String },
  otpExpires: { type: Date },
  role:{type:String},
});

module.exports = mongoose.model('User', UserSchema);




