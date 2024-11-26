const Student = require ('../model/Students')
const User = require('../model/User')
const School = require('../model/Schools');
const Coupon = require('../model/Coupon');
const Wallet = require('../model/Wallet');

const adminController ={


    getUsers: async (req, res) => {
        const { page = 1, limit = 10 } = req.query;
      
        try {
          const skip = (page - 1) * limit;
      
        
          const students = await Student.find().skip(skip).limit(parseInt(limit));
          const totalStudents = await Student.countDocuments();
      
         
          const teachers = await User.find({ role: 'teacher' }).skip(skip).limit(parseInt(limit));
          const totalTeachers = await User.countDocuments({ role: 'teacher' });
      
          res.json({
            students: {
              data: students,
              total: totalStudents,
            },
            teachers: {
              data: teachers,
              total: totalTeachers,
            },
          });
        } catch (error) {
          res.status(500).json({ message: 'Error fetching users' });
        }
      },

     editStudent: async (req, res) => {
        const { id } = req.params;
        const { name, class: studentClass, school } = req.body; 
      
        try {
          const student = await Student.findById(id);
          if (!student) {
            return res.status(404).json({ message: 'Student not found' });
          }
      
        
          student.name = name || student.name;
          student.class = studentClass || student.class;
          student.school = school || student.school;
      
          await student.save();
          res.status(200).json({ message: 'Student updated successfully', student });
        } catch (err) {
          res.status(500).json({ message: 'Error updating student', error: err.message });
        }
      },
      
  
      editTecaher: async(req, res) => {
        const { id } = req.params;
        const { name, mobileNumber, email } = req.body; 
      
        try {
          const teacher = await User.findById(id);
          if (!teacher) {
            return res.status(404).json({ message: 'Teacher not found' });
          }
      
         
          teacher.name = name || teacher.name;
          teacher.mobileNumber = mobileNumber || teacher.mobileNumber;
          teacher.email = email || teacher.email;
      
          await teacher.save();
          res.status(200).json({ message: 'Teacher updated successfully', teacher });
        } catch (err) {
          res.status(500).json({ message: 'Error updating teacher', error: err.message });
        }
      },
      
deleteStudent: async (req, res) => {
    const { id } = req.params;
  
    try {
      const student = await Student.findByIdAndDelete(id);
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }
  
      res.status(200).json({ message: 'Student deleted successfully' });
    } catch (err) {
      res.status(500).json({ message: 'Error deleting student', error: err.message });
    }
  },
  
 
  deleteTeacher: async (req, res) => {
    const { id } = req.params;
  
    try {
      const teacher = await User.findByIdAndDelete(id);
      if (!teacher) {
        return res.status(404).json({ message: 'Teacher not found' });
      }
  
      res.status(200).json({ message: 'Teacher deleted successfully' });
    } catch (err) {
      res.status(500).json({ message: 'Error deleting teacher', error: err.message });
    }
  },
  
 addSchool:async (req, res) => {
    const { name } = req.body;
  
    if (!name) {
      return res.status(400).json({ message: "School name is required" });
    }
  
    const newSchool = new School({ name });
    await newSchool.save();
    res.status(201).json({ message: "School added successfully", school: newSchool });
  },
  getSchools: async (req, res) => {
    try {
      const schools = await School.find();
      console.log(schools);
      
      res.status(200).json({ schools });
    } catch (error) {
      console.error("Error fetching schools:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
  getAllCoupons : async (req, res) => {
    try {
      const coupons = await Coupon.find();
      res.status(200).json(coupons);
    } catch (error) {
      res.status(500).json({ message: "Error fetching coupons", error });
    }
  },
  addCoupon : async (req, res) => {
    const { code, discount, expiryDate } = req.body;
  console.log(req.body);
  
    try {
      const existingCoupon = await Coupon.findOne({ code });
      if (existingCoupon) {
        return res.status(400).json({ message: "Coupon code already exists" });
      }
  
      const newCoupon = new Coupon({
        code,
        discount,
        expiryDate,
      });
  
      await newCoupon.save();
      res.status(201).json(newCoupon);
    } catch (error) {
      res.status(500).json({ message: "Error adding coupon", error });
    }
  },
  validateCoupon: async (req, res) => {
    const {  code} = req.body;
const userId='6731bd99d81af3e60c9e8178'
console.log(req.body);

  try {

    const coupon = await Coupon.findOne({ code: code });
    if (!coupon) {
      return res.status(404).json({ message: 'Invalid coupon code.' });
    }
console.log(coupon);

    if (new Date(coupon.expiryDate) < new Date()) {
      return res.status(400).json({ message: 'Coupon has expired.' });
    }

  
    const discount = coupon.discount;
    const wallet = await Wallet.findOneAndUpdate(
      { userId },
      { 
        $inc: { balance: discount },
        $push: {
          transactions: {
            type: 'credit',
            amount: discount,
            description: `Applied coupon: ${coupon.code}`,
          },
        },
      },
      { new: true, upsert: true } 
    );

 
    return res.status(200).json({
      message: 'Coupon applied successfully.',
      walletBalance: wallet.balance,
    });
  } catch (error) {
    console.error('Error applying coupon:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
},
}
module.exports=adminController