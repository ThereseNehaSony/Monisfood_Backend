const express = require('express');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/verify-token', authMiddleware, authController.verifyToken);
// router.post('/register', authController.register);
// router.post('/verify-otp', authController.verifyOTP);
router.post('/login/password', authController.loginWithPassword);
router.post('/login/otp', authController.loginWithOTP);
router.post('/verify-login-otp', authController.verifyLoginOTP);
router.post("/send-otp",authController.sendOtp)
router.post("/verify-otp",authController.verifyOtp)
router.post("/create-password",authController.register)



module.exports = router;