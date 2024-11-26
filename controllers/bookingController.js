const Booking = require('../model/Bookings')
const MenuItem = require('../model/MenuItems')
const {verifyPaymentSignature} =require('../util/verifyPayment')
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Wallet = require('../model/Wallet')
const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID, 
    key_secret: process.env.RAZORPAY_SECRET_KEY,
  });

const bookingController ={
  
   createRzpOrder: async (req, res) => {
        const { amount, currency = 'INR' } = req.body;
      console.log(req.body);
      
        try {
          const order = await razorpayInstance.orders.create({
            amount: amount * 100, 
            currency,
            receipt: `receipt_${Date.now()}`,
          });
      
          res.status(201).json(order);
        } catch (error) {
          console.error('Error creating Razorpay order:', error);
          res.status(500).json({ message: 'Failed to create order' });
        }
      },

    createBooking: async (req, res) => {
        const { userId,paymentDetails, meals, totalAmount, discount, walletBalanceUsed, paymentMethod } = req.body;
    console.log(paymentDetails);
    
        try {
          console.log('Incoming booking data:', req.body);
    
          // const userId = '6731bd99d81af3e60c9e8178'; 

      
          if (!meals || !meals.breakfast || !Array.isArray(meals.breakfast)) {
            return res.status(400).json({ message: 'Breakfast items are missing or malformed' });
          }
    
          if (!meals.lunch || !Array.isArray(meals.lunch)) {
            return res.status(400).json({ message: 'Lunch items are missing or malformed' });
          }
    
          if (!meals.snack || !Array.isArray(meals.snack)) {
            return res.status(400).json({ message: 'Snack items are missing or malformed' });
          }
    
        
          const breakfastItems = meals.breakfast.map((item) => ({
            name: item.name,
            details: item.details,
          }));
    
          const lunchItems = meals.lunch.map((item) => ({
            name: item.name,
            details: item.details,
          }));
    
          const snackItems = meals.snack.map((item) => ({
            name: item.name,
            details: item.details,
          }));
    
        
          if (paymentDetails) {
            const generatedSignature = crypto
              .createHmac('sha256',process.env.RAZORPAY_KEY_ID
                
              ) 
              .update(`${paymentDetails.razorpayOrderId}|${paymentDetails.razorpayPaymentId}`)
              .digest('hex');
    console.log(generatedSignature,"gen",paymentDetails.razorpaySignature,"pp");
    
            if (generatedSignature !== paymentDetails.razorpaySignature) {
             console.log('wrong');
             
              return res.status(400).json({ message: 'Payment verification failed' });
            }
          }
    
          
          const booking = new Booking({
            userId,
            selectedItems: {
              breakfast: breakfastItems,
              lunch: lunchItems,
              snack: snackItems,
            },
            totalAmount,
            discount,
            walletBalanceUsed,
            paymentMethod: paymentDetails ? 'Razorpay' : 'Free',
            paymentDetails: paymentDetails || null,
            status: paymentDetails ? 'confirmed' : 'free',
          });
    
          await booking.save();
          console.log(userId,"id");
          
          const wallet = await Wallet.findOne({ userId });
          
          
         wallet.balance = wallet.balance - walletBalanceUsed
         await wallet.save();
          res.status(201).json({ message: 'Booking created successfully', booking });
        } catch (error) {
          console.error('Error creating booking:', error);
          res.status(500).json({ message: 'Internal Server Error', error: error.message });
        }
      },
      getBookings: async (req, res) => {
        try {
          // Fetch userId from the authenticated user (assumed to be in req.user)
          const userId = '6731bd99d81af3e60c9e8178';
      
          // Fetch all bookings for the user, populate any required fields if needed
          const bookings = await Booking.find({ userId }).sort({ createdAt: -1 }); // Sorting by createdAt in descending order
      
          // If no bookings found, send a message
          if (!bookings.length) {
            return res.status(404).json({ message: 'No bookings found for this user' });
          }
      
          // Return the bookings data as a response
          res.status(200).json(bookings);
        } catch (error) {
          console.error(error);
          res.status(500).json({ message: 'Server error, please try again later' });
        }
      },
    getAllBookings : async (req, res) => {
      try {
        const categorizedBookings = await Booking.aggregate([
          {
            $unwind: {
              path: '$selectedItems.breakfast',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $unwind: {
              path: '$selectedItems.lunch',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $unwind: {
              path: '$selectedItems.snack',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $addFields: {
              mealType: {
                $cond: {
                  if: { $ne: ['$selectedItems.breakfast', null] },
                  then: 'Breakfast',
                  else: {
                    $cond: {
                      if: { $ne: ['$selectedItems.lunch', null] },
                      then: 'Lunch',
                      else: 'Snack',
                    },
                  },
                },
              },
              itemDetails: {
                $ifNull: [
                  '$selectedItems.breakfast',
                  { $ifNull: ['$selectedItems.lunch', '$selectedItems.snack'] },
                ],
              },
            },
          },
          {
            $group: {
              _id: {
                mealType: '$mealType',
                date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              },
              bookings: { $push: '$$ROOT' },
            },
          },
          {
            $sort: { '_id.date': 1, '_id.mealType': 1 },
          },
        ]);
    console.log(categorizedBookings);
    
        res.status(200).json({ categorizedBookings });
      } catch (error) {
        console.error('Error fetching categorized bookings:', error);
        res.status(500).json({ message: 'Internal Server Error' });
      }
    },
     
}
 
module.exports = bookingController