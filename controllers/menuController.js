const MenuItem = require('../model/MenuItems');
const DailyMenu = require('../model/DailyMenu');
const mongoose = require('mongoose');

const addMenuItem = async (req, res) => {
  const { name, description, portions, image } = req.body;
  console.log(req.body)
console.log(image,"sfaf");

  try {
    const menuItem = new MenuItem({ name, description, portions, image });
    await menuItem.save();
    res.status(201).json({ message: "Menu item added successfully!", menuItem });
  } catch (error) {
    res.status(500).json({ error: "Failed to add menu item." });
  }
};



const getAvailableItems = async (req, res) => {
  try {
    const items = await MenuItem.find();
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching menu items', error });
  }
};


const addDailyMenu = async (req, res) => {
  try {
    const { date, meals } = req.body;
    
    const formattedMeals = {
      breakfast: meals.breakfast.map(item => item._id || item),
      lunch: meals.lunch.map(item => item._id || item),
      snack: meals.snack.map(item => item._id || item)
    };

    let dailyMenu = await DailyMenu.findOne({ date });
    if (!dailyMenu) {
      dailyMenu = new DailyMenu({ 
        date, 
        meals: formattedMeals 
      });
    } else {
      dailyMenu.meals = formattedMeals;
    }

    await dailyMenu.save();
    
    const populatedMenu = await DailyMenu.findById(dailyMenu._id).populate({
      path: 'meals.breakfast meals.lunch meals.snack',
      model: 'MenuItem'
    });

    res.status(200).json(populatedMenu);
  } catch (error) {
    console.error('Error saving daily menu:', error);
    res.status(500).json({ message: 'Error saving daily menu', error: error.message });
  }
};


const getDailyMenu = async (req, res) => {
  try {
    const { date } = req.params;
    const dailyMenu = await DailyMenu.findOne({ date }).populate({
      path: 'meals.breakfast meals.lunch meals.snack', 
      model: 'MenuItem'
    });

    if (!dailyMenu) {
      return res.status(404).json({ message: 'Daily menu not found' });
    }

    res.status(200).json({
      date: dailyMenu.date,
      meals: {
        breakfast: dailyMenu.meals.breakfast || [],
        lunch: dailyMenu.meals.lunch || [],
        snack: dailyMenu.meals.snack || []
      }
    });
  } catch (error) {
    console.error('Error fetching daily menu:', error);
    res.status(500).json({ message: 'Error fetching daily menu', error: error.message });
  }
};

 const editMenuItem = async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, price, portions, image } = req.body;
  
      const updatedItem = await MenuItem.findByIdAndUpdate(
        id,
        { name, description, price ,portions, image},
        { new: true }
      );
  
      if (!updatedItem) {
        return res.status(404).json({ message: 'Item not found' });
      }
  
      res.status(200).json(updatedItem);
    } catch (error) {
      res.status(500).json({ message: 'Error updating item', error });
    }
  };
  

const deleteMenuItem = async (req, res) => {
    try {
      const { id } = req.params;
  
      const deletedItem = await MenuItem.findByIdAndDelete(id);
  
      if (!deletedItem) {
        return res.status(404).json({ message: 'Item not found' });
      }
  
      res.status(200).json({ message: 'Item deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting item', error });
    }


  };
const getMenu = async (req, res) => {
  const { category } = req.query; 
console.log(category);

if (!category) {
  return res.status(400).json({ message: 'Category is required' });
}

const currentDate = new Date().toISOString().split('T')[0]; 

try {

  const dailyMenu = await DailyMenu.findOne({ date: currentDate }).populate({
    path: `meals.${category}`,
    model: MenuItem,
  });

  if (!dailyMenu) {
    return res.status(404).json({ message: 'No menu found for today' });
  }


  const meals = dailyMenu.meals[category];
  console.log(meals,"dfd");
  
  res.json(meals);
} catch (error) {
  console.error(error);
  res.status(500).json({ message: 'Server error' });
}
}

const addWeeklyMenu = async (req, res) => {
  try {
    const { startDate, endDate, meals } = req.body;
    
    await DailyMenu.deleteMany({
      date: {
        $gte: startDate,
        $lte: endDate
      }
    });

    const dailyMenus = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (let date = start; date <= end; date.setDate(date.getDate() + 1)) {
      const currentDate = date.toISOString().split('T')[0];
      const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][date.getDay()];
      
      const dailyMenu = new DailyMenu({
        date: currentDate,
        meals: meals[dayOfWeek]
      });

      await dailyMenu.save();
      dailyMenus.push(dailyMenu);
    }

    res.status(200).json({
      message: 'Weekly menu saved successfully',
      menus: dailyMenus
    });
  } catch (error) {
    console.error('Error saving weekly menu:', error);
    res.status(500).json({ message: 'Error saving weekly menu', error: error.message });
  }
};

const saveMenu = async (req, res) => {
  const { dateRange, menu } = req.body; // Expecting dateRange and menu object from frontend
console.log(menu,"menu");

  // Validate date range and menu
  if (!dateRange || !dateRange.startDate || !dateRange.endDate || !menu) {
    return res.status(400).json({ message: 'Invalid data' });
  }

  // Function to generate all the dates between the start and end date
  const daysInRange = (startDate, endDate) => {
    const days = [];
    let start = new Date(startDate);
    const end = new Date(endDate);
    while (start <= end) {
      days.push(start.toISOString().split('T')[0]); // Format to "yyyy-mm-dd"
      start.setDate(start.getDate() + 1);
    }
    return days;
  };

  const dayRange = daysInRange(dateRange.startDate, dateRange.endDate); // Get the date range as an array

  try {
    const updatedMenus = []; // To store the updated menu documents

    // Loop through each day and save or update the menu items
    for (const day of dayRange) {
      const menuForDay = menu[day]; // Get menu for the specific day

      if (!menuForDay) {
        continue; // Skip if no menu data for this day
      }

      // Initialize meal data
      const mealData = {
        breakfast: [],
        lunch: [],
        snack: [],
      };

      // Update the meal types based on the provided data
      if (menuForDay.Breakfast && menuForDay.Breakfast.length > 0) {
        mealData.breakfast = await MenuItem.find({
          _id: { $in: menuForDay.Breakfast },
        }).select('_id'); // Fetch the selected items for breakfast
      }

      if (menuForDay.Lunch && menuForDay.Lunch.length > 0) {
        mealData.lunch = await MenuItem.find({
          _id: { $in: menuForDay.Lunch },
        }).select('_id'); // Fetch the selected items for lunch
      }

      if (menuForDay.Snacks && menuForDay.Snacks.length > 0) {
        mealData.snack = await MenuItem.find({
          _id: { $in: menuForDay.Snacks },
        }).select('_id'); // Fetch the selected items for snacks
      }

      // Save or update the menu for this day
      const dailyMenu = await DailyMenu.findOneAndUpdate(
        { date: day }, // Find the document for the specific day
        { $set: { meals: mealData } }, // Set the updated meal data for the day
        { new: true, upsert: true } // Create a new document if not found, otherwise update
      );

      updatedMenus.push(dailyMenu); // Add the saved/updated document to the array
    }

    // Respond with the updated menus
    res.status(200).json({ message: 'Menu saved successfully', data: updatedMenus });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to save menu', error: error.message });
  }
}
function getDaysInRange(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = [];
  
  while (start <= end) {
    days.push(new Date(start).toISOString().split('T')[0]); // Format as YYYY-MM-DD
    start.setDate(start.getDate() + 1); // Increment the date
  }
  
  return days;
}


const getWeeklyMenu = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const weeklyMenus = await DailyMenu.find({
      date: {
        $gte: startDate,
        $lte: endDate
      }
    }).populate({
      path: 'meals.breakfast meals.lunch meals.snack',
      model: 'MenuItem'
    }).sort({ date: 1 });

    if (!weeklyMenus.length) {
      return res.status(404).json({ message: 'No menus found for the specified week' });
    }

    const formattedMenus = weeklyMenus.reduce((acc, menu) => {
      const dateStr = menu.date;  
      acc[dateStr] = {
        breakfast: menu.meals.breakfast || [],
        lunch: menu.meals.lunch || [],
        snack: menu.meals.snack || []
      };
      return acc;
    }, {});

    res.status(200).json(formattedMenus);
  } catch (error) {
    console.error('Error fetching weekly menu:', error);
    res.status(500).json({ message: 'Error fetching weekly menu', error: error.message });
  }
}
const updateWeeklyMenu = async (req, res) => {
  try {
    const menus = req.body;

    // Validate the input data
    if (!menus || !Array.isArray(menus)) {
      return res.status(400).json({ message: "Invalid menu data. Expected an array of menus." });
    }

    // Process each menu in the array
    for (const menu of menus) {
      if (!menu.date || !menu.meals) {
        return res.status(400).json({ message: "Menu data is incomplete. Date and meals are required." });
      }

      const existingMenu = await DailyMenu.findOne({ date: menu.date });

      if (existingMenu) {
        // Update the existing menu
        existingMenu.meals.breakfast = menu.meals.breakfast.map((item) => item._id);
        existingMenu.meals.lunch = menu.meals.lunch.map((item) => item._id);
        existingMenu.meals.snack = menu.meals.snack.map((item) => item._id);
        await existingMenu.save();
      } else {
        // Create a new menu for the given date
        await DailyMenu.create({
          date: menu.date,
          meals: {
            breakfast: menu.meals.breakfast.map((item) => item._id),
            lunch: menu.meals.lunch.map((item) => item._id),
            snack: menu.meals.snack.map((item) => item._id),
          },
        });
      }
    }

    // Return success response
    return res.status(200).json({ message: "Menu updated successfully!" });

  } catch (error) {
    // Handle unexpected errors
    console.error("Error updating weekly menu:", error);
    return res.status(500).json({ message: "Failed to update menus. Please try again.", error: error.message });
  }
};




module.exports = {getMenu, addMenuItem, getAvailableItems, addDailyMenu, getDailyMenu ,deleteMenuItem, editMenuItem, addWeeklyMenu, getWeeklyMenu,updateWeeklyMenu,saveMenu};
