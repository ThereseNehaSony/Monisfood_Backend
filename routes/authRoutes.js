const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/register', authController.register);
router.post('/verify-otp', authController.verifyOTP);
router.post('/login/password', authController.loginWithPassword);
router.post('/login/otp', authController.loginWithOTP);
router.post('/verify-login-otp', authController.verifyLoginOTP);

module.exports = router;
