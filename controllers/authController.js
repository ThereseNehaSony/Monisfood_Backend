const User = require('../model/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const Otp = require('../model/Otp');

const sendEmail = require('../util/sendOtp');
const Wallet = require('../model/Wallet');

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
 
  sendOtp : async (req, res) => {
    const { email } = req.body.email 
    console.log(req.body); 
    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }
  
    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
    // Set OTP expiration time (10 minutes)
    const otpExpiration = Date.now() + 10 * 60 * 1000;
  
    // Save OTP to database
    await Otp.findOneAndUpdate(
      { email },
      { otp, otpExpiration },
      { upsert: true, new: true }
    );
  
    const mailOptions = {
      from: process.env.AUTH_EMAIL,
      to: email,
      subject: 'Verify your email using OTP',
      html: `<p>Hai User,
        Your one-time password (OTP) for logging into Monis Food is: <strong>${otp}</strong></p>`
    };

    console.log("otp is..............", otp);

    await sendEmail(mailOptions);
  
    res.status(200).json({ message: "OTP sent successfully!" });
  },

verifyOtp: async (req, res) => {
  const { email,otp } = req.body.email;
console.log(req.body);

  // Find the OTP record by email
  const otpRecord = await Otp.findOne({ email });
  if (!otpRecord) {
    return res.status(400).json({ message: "OTP not found or expired" });
  }

  // Check if OTP is correct and not expired
  if (otpRecord.otp !== otp || Date.now() > otpRecord.otpExpiration) {
    return res.status(400).json({ message: "Invalid or expired OTP" });
  }

  // Delete OTP record after successful verification
  await Otp.deleteOne({ email });

  res.status(200).json({ message: "OTP verified successfully" });
},

register: async (req, res) => {
  const { email, password,role } = req.body.email;

  // Check if the email has a verified OTP
  const otpRecord = await Otp.findOne({ email });
  if (otpRecord) {
    return res
      .status(400)
      .json({ message: "OTP verification required before creating password" });
  }

  // Hash the password before saving
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create and save the user
  const user = new User({ email, password: hashedPassword ,role});
  await user.save();

  const wallet = new Wallet({
    userId: user._id,
    balance: 0, // Initial balance (you can change this as needed)
  });
  await wallet.save();
  // Generate a JWT token
  const token = jwt.sign(
    { userId: user._id },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  res.status(201).json({ message: "Account created successfully", token, userId: user._id, 
    role: user.role, });
},

verifyToken: async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        _id: user._id,
        email: user.email,
        mobileNumber: user.mobileNumber
      },
      role: user.role
    });
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
},



loginWithPassword: async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email:email });

    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign(
      { 
        userId: user._id,
        role: user.role 
      }, 
      'your-secret-key', 
      { expiresIn: '24h' }
    );
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    return res.json({ 
      token, 
      user,
      userId: user._id, 
      role: user.role, 
      message: 'Login successful' 
    });
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