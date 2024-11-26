const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay instance with your key and secret
const razorpay = new Razorpay({
  key_id: 'rzp_test_dsyfUQFYvQxI5n', // Your Razorpay key ID
  key_secret: 'jFSELK70gspyHiktv0SmvVkv' // Your Razorpay secret key
});

// Function to verify the payment signature
const verifyPaymentSignature = (paymentDetails) => {
  // Extract the necessary data from the paymentDetails
  const { razorpayPaymentId, razorpayOrderId, razorpaySignature } = paymentDetails;

  // Generate the signature from the received data
  const generatedSignature = crypto
    .createHmac('sha256', razorpay.key_secret)
    .update(razorpayOrderId + "|" + razorpayPaymentId)
    .digest('hex');

  // Compare the generated signature with the received signature
  return generatedSignature === razorpaySignature;
};
