const mongoose = require('mongoose');

const dailyMenuSchema = new mongoose.Schema({
  date: { type: String, required: true }, 
  meals: {
    breakfast: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' }],
    lunch: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' }],
    snack: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' }],
  },
});

const DailyMenu = mongoose.model('DailyMenu', dailyMenuSchema);

module.exports = DailyMenu;
