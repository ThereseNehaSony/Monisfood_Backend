const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String,  },
  email: { type: String, },
  name: { type: String, },
  address: { type: String },
  password: { type: String },
  otp: { type: String },
  otpExpires: { type: Date },
  role: { type: String, enum: ['teacher', 'parent'] },
});

module.exports = mongoose.model('User', UserSchema);




