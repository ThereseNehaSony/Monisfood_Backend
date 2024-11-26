const User = require('../model/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.AUTH_EMAIL,
    pass: process.env.AUTH_PASS,
  },
});

// Generate OTP
const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString();

const authController ={

// Register
register : async (req, res) => {
  const { mobileNumber, email } = req.body;

  try {
    const user = new User({ mobileNumber, email, otp: generateOTP(), otpExpires: Date.now() + 10 * 60 * 1000 });

    await user.save();

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your OTP Code',
      text: `Your OTP code is ${user.otp}`,
    });

    res.status(201).json({ message: 'OTP sent to email.' });
  } catch (err) {
    res.status(500).json({ error: 'Error registering user.' });
  }
},

verifyOTP : async (req, res) => {
  const { mobileNumber, otp, password } = req.body;

  try {
    const user = await User.findOne({ mobileNumber });

    if (!user || user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ error: 'Invalid or expired OTP.' });
    }

    user.password = await bcrypt.hash(password, 10);
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Account verified and password set.' });
  } catch (err) {
    res.status(500).json({ error: 'Error verifying OTP.' });
  }
},


loginWithPassword: async (req, res) => {
  const { mobileNumber, password } = req.body;
  console.log(req.body);
  console.log(mobileNumber,"mm")

  try {
   
    const user = await User.findOne({ mobileNumber: mobileNumber.mobileNumber });
    console.log(user);

    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    
    if (mobileNumber.password !== user.password) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

  
    const token = jwt.sign({ userId: user._id }, 'your-secret-key', { expiresIn: '1h' });

    return res.json({ token, userId: user._id, role:user.role, message: 'Login successful' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
},

// Login with OTP
loginWithOTP : async (req, res) => {
  const { mobileNumber } = req.body;

  try {
    const user = await User.findOne({ mobileNumber });

    if (!user) return res.status(404).json({ error: 'User not found.' });

    user.otp = generateOTP();
    user.otpExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Your OTP Code',
      text: `Your OTP code is ${user.otp}`,
    });

    res.json({ message: 'OTP sent to email.' });
  } catch (err) {
    res.status(500).json({ error: 'Error sending OTP.' });
  }
},

// Verify Login OTP
verifyLoginOTP : async (req, res) => {
  const { mobileNumber, otp } = req.body;

  try {
    const user = await User.findOne({ mobileNumber });

    if (!user || user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ error: 'Invalid or expired OTP.' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: 'Error verifying login OTP.' });
  }
},

}

module.exports = authController;