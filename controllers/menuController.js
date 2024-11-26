const MenuItem = require('../model/MenuItems');
const DailyMenu = require('../model/DailyMenu');


const addMenuItem = async (req, res) => {
  const { name, description, portions, image } = req.body;
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
      const { name, description, price } = req.body;
  
      const updatedItem = await MenuItem.findByIdAndUpdate(
        id,
        { name, description, price },
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
};


module.exports = {getMenu, addMenuItem, getAvailableItems, addDailyMenu, getDailyMenu ,deleteMenuItem, editMenuItem, addWeeklyMenu, getWeeklyMenu};
