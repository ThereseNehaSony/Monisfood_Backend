const Student = require ('../model/Students')
const DailyMenu = require('../model/DailyMenu')
const User = require('../model/User')
const Wallet = require('../model/Wallet')
const userController = {

    // Add a new student
 addStudent : async (req, res) => {
    try {
      const { userId } = req.query;
      const { name, class: studentClass, school } = req.body;
  console.log(userId);
  
      const newStudent = new Student({
        name,
        class: studentClass,
        school,
        userId,
      });
  
      await newStudent.save();
      res.status(201).json(newStudent);
    } catch (error) {
      res.status(500).json({ error: 'Failed to add student' });
    }
  },
  
  // Get all students
  getStudents : async (req, res) => {
    try {
      const { userId } = req.query;
      const students = await Student.find({ userId });
      res.json(students);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch students' });
    }
  },

  getMenu: async (req, res) => {
    try {
      const { date } = req.params;
      console.log(date,"date");
      
      const dailyMenu = await DailyMenu.findOne({ date }).populate({
        path: 'meals.breakfast meals.lunch meals.snack',
        model: 'MenuItem',
      });
  console.log(dailyMenu,"dddd");
  
      if (!dailyMenu) {
        return res.status(404).json({ message: 'Menu not found for the specified date' });
      }
      res.json(dailyMenu.meals);
    } catch (error) {
      console.error('Error fetching daily menu:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },



  getWeeklyMenu : async (req, res) => {
    try {
      const { startDate } = req.params;
      console.log(startDate, "startDate");
  
      // Convert the start date to a Date object
      const start = new Date(startDate);
  
      // Get the start of the week (Monday) and end of the week (Sunday)
      const startOfWeek = new Date(start);
      const endOfWeek = new Date(start);
  
      // Set startOfWeek to Monday and endOfWeek to Sunday
      startOfWeek.setDate(start.getDate() - start.getDay() + 1); // Set to Monday
      endOfWeek.setDate(start.getDate() - start.getDay() + 7); // Set to Sunday
  
      // Format the dates as YYYY-MM-DD (standard format)
      const formatDate = (date) => {
        return date.toISOString().split('T')[0];
      };
  
      const weeklyMenu = {};
  
      // Loop through all 7 days of the week and fetch the menu for each day
      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(startOfWeek);
        currentDate.setDate(startOfWeek.getDate() + i); // Increment by day
        const formattedDate = formatDate(currentDate);
  
        const dailyMenu = await DailyMenu.findOne({ date: formattedDate }).populate({
          path: 'meals.breakfast meals.lunch meals.snack',
          model: 'MenuItem',
        });
  
        if (dailyMenu) {
          // Separate meals by type
          weeklyMenu[formattedDate] = {
            breakfast: dailyMenu.meals.breakfast || [],
            lunch: dailyMenu.meals.lunch || [],
            snack: dailyMenu.meals.snack || [],
          };
        } else {
          // If no menu is found for the day, set empty arrays for each meal type
          weeklyMenu[formattedDate] = {
            breakfast: [],
            lunch: [],
            snack: [],
          };
        }
      }
  console.log(weeklyMenu);
  
      if (Object.keys(weeklyMenu).length === 0) {
        return res.status(404).json({ message: 'No menus found for the week' });
      }
  
      res.json(weeklyMenu);
    } catch (error) {
      console.error('Error fetching weekly menu:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },


  getUserDetails : async (req, res) => {
    const { userId } = req.params;
  console.log(userId,"id");
  
    try {
      const user = await User.findById(userId);
      console.log(user,"sdsd");
      
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      res.status(200).json(user);
    } catch (error) {
      console.error('Error fetching user details:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  updateUserDetails : async (req, res) => {
    const { userId } = req.params;
    const { name, email, address } = req.body;
    console.log(userId,name,"name");
    
  
    try {
      const user = await User.findById(userId);
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      user.name = name || user.name;
      user.email = email || user.email;
      user.address = address || user.address;
  
      await user.save();
  
      res.status(200).json({ message: 'User details updated successfully', user });
    } catch (error) {
      console.error('Error updating user details:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },






}

module.exports = userController