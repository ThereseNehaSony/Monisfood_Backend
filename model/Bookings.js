const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: {
    type: String,
    
  },
  name:{type:String},
  selectedItems: {
    breakfast: [
      {
        name: { type: String, }, 
        details: {
          size: { type: String, },
          price: { type: Number,  }, 
          quantity: { type: Number,  }, 
        },
        canceled: { type: Boolean, default: false },
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
        canceled: { type: Boolean, default: false },
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
        canceled: { type: Boolean, default: false },
      },
    ],
  },
  totalAmount: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  walletBalanceUsed: { type: Number, default: 0 },
  paymentMethod: { type: String },
  paymentStatus: { type: String, default: 'Pending' },
  mealDate: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Booking', bookingSchema);





// const mongoose = require('mongoose');

// const bookingSchema = new mongoose.Schema({
//   userId: {
//     type: String,
//   },
//   name:{type:String},
//   selectedItems: {
//     type: Map,
//     of: {
//       breakfast: [
//         {
//           name: { type: String },
//           details: {
//             size: { type: String },
//             price: { type: Number },
//             quantity: { type: Number },
//           },
//         },
//       ],
//       lunch: [
//         {
//           name: { type: String },
//           details: {
//             size: { type: String },
//             price: { type: Number },
//             quantity: { type: Number },
//           },
//         },
//       ],
//       snack: [
//         {
//           name: { type: String },
//           details: {
//             size: { type: String },
//             price: { type: Number },
//             quantity: { type: Number },
//           },
//         },
//       ],
//     },
//   },
//   totalAmount: { type: Number, required: true },
//   discount: { type: Number, default: 0 },
//   walletBalanceUsed: { type: Number, default: 0 },
//   paymentMethod: { type: String },
//   paymentStatus: { type: String, default: 'Pending' },
//   createdAt: { type: Date, default: Date.now },
// });

// module.exports = mongoose.model('Booking', bookingSchema);
