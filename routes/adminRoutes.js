const express = require('express');
const Student = require ('../model/Students')
const MenuItem = require('../model/MenuItems');
const DailyMenu = require('../model/DailyMenu');
const {
  addMenuItem,
  getAvailableItems,
  addDailyMenu,
  getDailyMenu,
  editMenuItem,
  deleteMenuItem,
  addWeeklyMenu,
  getWeeklyMenu,
  updateWeeklyMenu,
  saveMenu
} = require('../controllers/menuController');
const { generatePDF } = require('../util/generatePDF'); 
const adminController = require('../controllers/adminController');
const bookingController = require('../controllers/bookingController');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

router.post('/menu-item', addMenuItem);
router.get('/menu-items', getAvailableItems);
router.post('/daily-menu', addDailyMenu);
router.get('/daily-menu/:date', getDailyMenu);
router.put('/menu-item/:id', editMenuItem);
router.delete('/menu-item/:id', deleteMenuItem);
router.post('/weekly-menu', addWeeklyMenu);
router.get('/weekly-menu', getWeeklyMenu); 
router.post("/update-weekly-menu", updateWeeklyMenu);
router.post('/save-menu',saveMenu)

router.get('/users',adminController.getUsers )
router.put('/students/:id',adminController.editStudent)
router.put('/teachers/:id',adminController.editTecaher)
router.delete('/students/:id', adminController.deleteStudent)
router.delete('/teachers/:id', adminController.deleteTeacher)


router.post('/schools',adminController.addSchool)
router.get('/schools',adminController.getSchools)
router.put("/schools/:id",adminController.editSchool)
router.delete("/schools/:id",adminController.deleteSchool)

router.get("/coupons", adminController.getAllCoupons);
router.post('/coupons/validate', adminController.validateCoupon)

router.get('/bookings',bookingController.getAllBookings)
router.get('/revenue/:timePeriod',adminController.getMealRevenue)
router.post("/coupons", adminController.addCoupon);

router.get('/export/students', async (req, res) => {
  try {
    const { type } = req.query; 
    const details = await Student.find() 
    console.log(details,"dd");
    

    const pdfBuffer = await generatePDF(details); 
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${type}_details.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ message: 'Error generating PDF' });
  }
});

function getWeekDates() {
  const now = new Date();
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())); 
  const weekDates = [];

  for (let i = 0; i < 7; i++) {
    const current = new Date(startOfWeek);
    current.setDate(startOfWeek.getDate() + i);
    weekDates.push(current.toISOString().split('T')[0]); 
  }

  return weekDates;
}

// Weekly Menu Route
router.get('/menu/weekly', async (req, res) => {
  try {
    const weekDates = getWeekDates();

   
    const weeklyMenu = await MenuItem.find({
      date: { $in: weekDates }
    }).sort({ date: 1 });

    const groupedMenu = weeklyMenu.reduce((acc, menu) => {
      const formattedDate = menu.date.toISOString().split('T')[0];

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
