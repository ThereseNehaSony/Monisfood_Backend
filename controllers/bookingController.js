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
        const { userId, paymentDetails, name, meals, totalAmount, discount, walletBalanceUsed, paymentMethod } = req.body;
        console.log(paymentDetails);
      
        try {
          console.log('Incoming booking data:', req.body);
      
          if (!meals || typeof meals !== 'object') {
            return res.status(400).json({ message: 'Invalid meals data' });
          }
      
          // Process meals if they exist
          const breakfastItems = meals.breakfast && Array.isArray(meals.breakfast)
            ? meals.breakfast.map((item) => ({ name: item.name, details: item.details }))
            : [];
      
          const lunchItems = meals.lunch && Array.isArray(meals.lunch)
            ? meals.lunch.map((item) => ({ name: item.name, details: item.details }))
            : [];
      
          const snackItems = meals.snack && Array.isArray(meals.snack)
            ? meals.snack.map((item) => ({ name: item.name, details: item.details }))
            : [];
      
          console.log({ breakfastItems, lunchItems, snackItems });
      
          // Verify payment details if present
          if (paymentDetails) {
            const generatedSignature = crypto
              .createHmac('sha256', process.env.RAZORPAY_SECRET_KEY)
              .update(`${paymentDetails.razorpayOrderId}|${paymentDetails.razorpayPaymentId}`)
              .digest('hex');
            console.log(generatedSignature, "gen", paymentDetails.razorpaySignature, "pp");
      
            if (generatedSignature !== paymentDetails.razorpaySignature) {
              console.log('wrong');
              return res.status(400).json({ message: 'Payment verification failed' });
            }
          }
      
          // Create the booking
          const bookingDate = new Date();
          const mealDate = new Date();
          mealDate.setDate(mealDate.getDate() + 1);
      
          const booking = new Booking({
            userId,
            selectedItems: {
              breakfast: breakfastItems,
              lunch: lunchItems,
              snack: snackItems,
            },
            name,
            totalAmount,
            discount,
            walletBalanceUsed,
            paymentMethod: paymentDetails ? 'Razorpay' : 'Free',
            paymentDetails: paymentDetails || null,
            status: paymentDetails ? 'confirmed' : 'free',
            mealDate,
          });
      console.log(booking,"booking");
      
          // Save the booking first
          await booking.save();
          console.log(userId, "id");
      
          // Now, update the wallet balance after successful booking
          const wallet = await Wallet.findOne({ userId });
          if (!wallet) {
            return res.status(404).json({ message: 'Wallet not found.' });
          }
      
          // Deduct the wallet balance for the used wallet amount
          wallet.balance -= walletBalanceUsed;
      
          // If a discount was applied, credit it to the wallet
          if (discount && discount > 0) {
            wallet.balance += discount;
            console.log(`Discount of ${discount} credited to wallet`);
          }
      
          // Save the updated wallet
          await wallet.save();
      
          // Return success response
          res.status(201).json({ message: 'Booking created successfully', booking });
        } catch (error) {
          console.error('Error creating booking:', error);
          res.status(500).json({ message: 'Internal Server Error', error: error.message });
        }
      },
      
      getBookings: async (req, res) => {
        try {
          // Fetch userId from the authenticated user (assumed to be in req.user)
          const { userId } = req.params;
      console.log(userId);
      
          // Fetch all bookings for the user, populate any required fields if needed
          const bookings = await Booking.find({ userId }).sort({ createdAt: -1 }); // Sorting by createdAt in descending order
      
          // If no bookings found, send a message
          // if (!bookings.length) {
          //   return res.status(404).json({ message: 'No bookings found for this user' });
          // }
      
          // Return the bookings data as a response
          res.status(200).json(bookings);
        } catch (error) {
          console.error(error);
          res.status(500).json({ message: 'Server error, please try again later' });
        }
      },
     

      
       getAllBookings : async (req, res) => {
        const { startDate, endDate, mealType, userCategory } = req.query;
    
    try {
      const matchFilters = {};
      
      // Apply date range filter if available
      if (startDate && endDate) {
        matchFilters.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
      }
      
      // Apply user category filter if available
      if (userCategory) {
        matchFilters.userCategory = userCategory;
      }
      
      // Aggregation pipeline
      const categorizedBookings = await Booking.aggregate([
        // Match initial filters (date range, user category, etc.)
        { $match: matchFilters },
        
        // Flatten the selectedItems (all meal types into a single array)
        {
          $project: {
            mealTypeItems: {
              $concatArrays: [
                {
                  $map: {
                    input: '$selectedItems.breakfast',
                    as: 'item',
                    in: { type: 'breakfast', details: '$$item' },
                  },
                },
                {
                  $map: {
                    input: '$selectedItems.lunch',
                    as: 'item',
                    in: { type: 'lunch', details: '$$item' },
                  },
                },
                {
                  $map: {
                    input: '$selectedItems.snack',
                    as: 'item',
                    in: { type: 'snack', details: '$$item' },
                  },
                },
              ],
            },
            createdAt: 1,
          },
        },

        // Unwind the combined meal type array
        { $unwind: '$mealTypeItems' },

        // Add fields for meal type and item details
        {
          $addFields: {
            mealType: '$mealTypeItems.type',
            itemDetails: '$mealTypeItems.details',
          },
        },
        
        // Apply meal type filter if provided (moved to after the $addFields stage)
        ...(mealType ? [{ $match: { mealType } }] : []),

        // Group by meal type and date
        {
          $group: {
            _id: {
              mealType: '$mealType',
              date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            },
            bookings: { $push: '$$ROOT' },
          },
        },

        // Sort categorized bookings by date and meal type
        { $sort: { '_id.date': 1, '_id.mealType': 1 } },
      ]);

      console.log(categorizedBookings);

      res.status(200).json({ categorizedBookings });
    } catch (error) {
      console.error('Error fetching categorized bookings:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  },

  cancelMeal: async (req, res) => {
    const { orderId, mealType, itemIndex } = req.body;
  
    try {
      console.log('Request Body:', req.body);
  
      if (!orderId || !mealType || itemIndex === undefined) {
        return res.status(400).json({ message: 'Invalid request data' });
      }
  
      const booking = await Booking.findById(orderId);
      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }
  
      console.log('Booking Found:', booking);
      console.log('Selected Items:', booking.selectedItems);
  
      // Validate mealType and mealIndex
      const mealArray = booking.selectedItems[mealType];
      console.log('Meal Type Array:', mealArray);
  
      if (!Array.isArray(mealArray) || itemIndex >= mealArray.length) {
        return res.status(404).json({ message: 'Meal not found or invalid index' });
      }
  
      // Access the meal object
      const meal = mealArray[itemIndex];
      console.log('Meal:', meal);
  
      if (!meal) {
        console.log("no mea");
        
        return res.status(404).json({ message: 'Meal not found' });
      }
  
      // For testing purposes, set deadlines relative to the current time
      const currentTime = new Date();
      const cancellationDeadline = new Date(currentTime.getTime() + (mealType === 'breakfast' ? 5 : 10) * 60 * 1000);
      console.log('Current Time:', currentTime);
      console.log('Cancellation Deadline:', cancellationDeadline);
  
      if (currentTime > cancellationDeadline) {
        return res.status(400).json({ message: 'Cancellation deadline passed' });
      }
  
      meal.canceled = true;
      const refundAmount = meal.details.price * meal.details.quantity;
  
      // Uncomment if wallet balance is used
      // booking.walletBalanceUsed = (booking.walletBalanceUsed || 0) + refundAmount;
  
      await booking.save();
      return res.status(200).json({ message: 'Meal canceled, credits added to wallet' });
    } catch (error) {
      console.error('Error:', error.message);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },
  
      
    
}
 
module.exports = bookingController