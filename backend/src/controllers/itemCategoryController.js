import ItemCategory from "../models/ItemCategory.js";
import Department from "../models/Department.js";

// GET all categories
export const getItemCategories = async (req, res) => {
  try {
    const categories = await ItemCategory.find().populate("department", "name");
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// CREATE category
export const createItemCategory = async (req, res) => {
  try {
    const { name, code, department } = req.body;

    if (!name || !department) {
      return res.status(400).json({ message: "Name & Department required" });
    }

    const newCat = new ItemCategory({
      name,
      code,
      department,
    });

    await newCat.save();

    const populated = await newCat.populate("department", "name");

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE category
export const updateItemCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, department } = req.body;

    const updated = await ItemCategory.findByIdAndUpdate(
      id,
      { name, code, department },
      { new: true }
    ).populate("department", "name");

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE category
export const deleteItemCategory = async (req, res) => {
  try {
    const { id } = req.params;
    await ItemCategory.findByIdAndDelete(id);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
