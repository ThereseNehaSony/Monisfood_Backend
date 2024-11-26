const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  portions: {
    small: { type: Number, required: false }, 
    medium: { type: Number, required: false }, 
    large: { type: Number, required: false }, 
  },
  image: { type: String, required: false }, 
});

const MenuItem = mongoose.model('MenuItem', menuItemSchema);

module.exports = MenuItem;
