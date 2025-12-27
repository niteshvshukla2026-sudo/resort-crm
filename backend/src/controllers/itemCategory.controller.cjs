module.exports = function createItemCategoryController(mongoose) {
  const ItemCategory = require("../models/itemCategory.model.cjs")(mongoose);

  // ================= GET ALL =================
  const listItemCategories = async (req, res) => {
    try {
      const list = await ItemCategory.find().sort({ name: 1 });
      res.json(list); // frontend expects array directly
    } catch (err) {
      console.error("listItemCategories error:", err);
      res.status(500).json({ message: "Failed to load item categories" });
    }
  };

  // ================= CREATE =================
  const createItemCategory = async (req, res) => {
    try {
      const { name, code, departmentCategory, department } = req.body;

      const deptValue = departmentCategory || department;

      if (!name || !deptValue) {
        return res.status(400).json({
          message: "Name and Department are required",
        });
      }

      const exists = await ItemCategory.findOne({ code });
      if (exists) {
        return res.status(400).json({
          message: "Item category code already exists",
        });
      }

      const created = await ItemCategory.create({
        name: name.trim(),
        code: code?.trim(),
        departmentCategory: deptValue,
      });

      res.json(created);
    } catch (err) {
      console.error("createItemCategory error:", err);
      res.status(500).json({ message: "Failed to create item category" });
    }
  };

  // ================= UPDATE =================
  const updateItemCategory = async (req, res) => {
    try {
      const { id } = req.params;
      const { name, code, departmentCategory, department } = req.body;

      const deptValue = departmentCategory || department;

      const updated = await ItemCategory.findByIdAndUpdate(
        id,
        {
          name: name?.trim(),
          code: code?.trim(),
          departmentCategory: deptValue,
        },
        { new: true }
      );

      if (!updated) {
        return res.status(404).json({ message: "Item category not found" });
      }

      res.json(updated);
    } catch (err) {
      console.error("updateItemCategory error:", err);
      res.status(500).json({ message: "Failed to update item category" });
    }
  };

  // ================= DELETE =================
  const deleteItemCategory = async (req, res) => {
    try {
      const { id } = req.params;

      const deleted = await ItemCategory.findByIdAndDelete(id);
      if (!deleted) {
        return res.status(404).json({ message: "Item category not found" });
      }

      res.json({ ok: true });
    } catch (err) {
      console.error("deleteItemCategory error:", err);
      res.status(500).json({ message: "Failed to delete item category" });
    }
  };

  return {
    listItemCategories,
    createItemCategory,
    updateItemCategory,
    deleteItemCategory,
  };
};
