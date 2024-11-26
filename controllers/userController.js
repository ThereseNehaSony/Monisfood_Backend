const Student = require ('../model/Students')
const DailyMenu = require('../model/DailyMenu')
const User = require('../model/User')
const Wallet = require('../model/Wallet')
const userController = {

    // Add a new student
 addStudent : async (req, res) => {
    try {
      const { name, class: studentClass, school } = req.body;
  
      const newStudent = new Student({
        name,
        class: studentClass,
        school,
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
      const students = await Student.find();
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