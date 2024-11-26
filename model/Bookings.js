const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: {
    type: String,
    
  },
  selectedItems: {
    breakfast: [
      {
        name: { type: String, }, 
        details: {
          size: { type: String, },
          price: { type: Number,  }, 
          quantity: { type: Number,  }, 
        },
      },
    ],
    lunch: [
      {
        name: { type: String,  },
        details: {
          size: { type: String,  },
          price: { type: Number,  },
          quantity: { type: Number,  },
        },
      },
    ],
    snack: [
      {
        name: { type: String,  },
        details: {
          size: { type: String,  },
          price: { type: Number,  },
          quantity: { type: Number,  },
        },
      },
    ],
  },
  totalAmount: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  walletBalanceUsed: { type: Number, default: 0 },
  paymentMethod: { type: String },
  paymentStatus: { type: String, default: 'Pending' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Booking', bookingSchema);
