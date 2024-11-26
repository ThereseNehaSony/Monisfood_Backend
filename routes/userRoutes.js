const express = require('express');
const authController = require('../controllers/authController');
const DailyMenu= require('../model/DailyMenu')
const Menu = require('../model/MenuItems')
const menuController = require('../controllers/menuController')
const userController = require('../controllers/userController');
const walletController = require('../controllers/walletController');
const bookingController = require('../controllers/bookingController');
const router = express.Router();

router.get('/meals',menuController.getMenu )
router.get('/students', userController.getStudents)
router.post('/students', userController.addStudent)
router.get('/menu/:date',userController.getMenu)
 router.get('/:userId', userController.getUserDetails);
router.get('/wallet/balance',walletController.getWalletBalance)
router.get('/wallet/data',walletController.getWalletData)

router.post('/bookings',bookingController.createBooking)
router.post('/create-order',bookingController.createRzpOrder)

router.get('/get/bookings', bookingController.getBookings)

router.put('/:userId', userController.updateUserDetails);

function getWeekDates() {
  const now = new Date();
  console.log(now,"now");
  
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())); 
  const weekDates = [];

  for (let i = 0; i < 7; i++) {
    const current = new Date(startOfWeek);
    current.setDate(startOfWeek.getDate() + i);
    weekDates.push(current.toISOString().split('T')[0]); 
  }
console.log(weekDates,"dates..");

  return weekDates;
}

// Weekly Menu Route
router.get('/get-menu/weekly', async (req, res) => {
  try {
    const weekDates = getWeekDates();

 
    const weeklyMenu = await DailyMenu.find({
      date: { $in: weekDates }
    }).sort({ date: 1 });
console.log(weeklyMenu,'menu');

   
    const groupedMenu = weeklyMenu.reduce((acc, menu) => {
      const formattedDate = menu.date.toString().split('T')[0];

      if (!acc[formattedDate]) {
        acc[formattedDate] = { breakfast: [], lunch: [], dinner: [] };
      }

      acc[formattedDate][menu.mealType] = menu.items;
      return acc;
    }, {});

    res.json(groupedMenu);
  } catch (error) {
    console.error('Error fetching weekly menu:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
  module.exports = router;