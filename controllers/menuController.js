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

    let dailyMenu = await DailyMenu.findOne({ date });

    if (!dailyMenu) {
      dailyMenu = new DailyMenu({ date, meals });
      await dailyMenu.save();
    } else {
      dailyMenu.meals = meals;
      await dailyMenu.save();
    }

    res.status(200).json(dailyMenu);
  } catch (error) {
    res.status(500).json({ message: 'Error saving daily menu', error });
  }
};


const getDailyMenu = async (req, res) => {
  try {
    const { date } = req.params;
    const dailyMenu = await DailyMenu.findOne({ date }).populate({
      path: 'meals.breakfast lunch snack',
      model: 'MenuItem',
    });

    if (!dailyMenu) {
      return res.status(404).json({ message: 'Daily menu not found' });
    }

    res.status(200).json(dailyMenu);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching daily menu', error });
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


module.exports = {getMenu, addMenuItem, getAvailableItems, addDailyMenu, getDailyMenu ,deleteMenuItem, editMenuItem};
