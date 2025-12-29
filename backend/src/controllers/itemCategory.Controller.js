const mongoose = require("mongoose");

exports.listItemCategories = async (req, res) => {
  try {
    const ItemCategory = mongoose.models.ItemCategory;

    const docs = await ItemCategory.find()
      .sort({ createdAt: -1 })
      .lean();

    res.json(docs);
  } catch (err) {
    console.error("LIST ITEM CATEGORY ERROR", err);
    res.status(500).json({ message: "Failed to load item categories" });
  }
};

exports.createItemCategory = async (req, res) => {
  try {
    const ItemCategory = mongoose.models.ItemCategory;

    const payload = {
      name: req.body.name,
      code: req.body.code,
      departmentCategory:
        req.body.departmentCategory ||
        req.body.department ||
        req.body.dept,
    };

    const doc = await ItemCategory.create(payload);
    res.status(201).json(doc);
  } catch (err) {
    console.error("CREATE ITEM CATEGORY ERROR", err);
    res.status(500).json({ message: "Failed to create item category" });
  }
};

exports.updateItemCategory = async (req, res) => {
  try {
    const ItemCategory = mongoose.models.ItemCategory;

    const payload = {
      name: req.body.name,
      code: req.body.code,
      departmentCategory:
        req.body.departmentCategory ||
        req.body.department ||
        req.body.dept,
    };

    const updated = await ItemCategory.findByIdAndUpdate(
      req.params.id,
      { $set: payload },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Item category not found" });
    }

    res.json(updated);
  } catch (err) {
    console.error("UPDATE ITEM CATEGORY ERROR", err);
    res.status(500).json({ message: "Failed to update item category" });
  }
};

exports.deleteItemCategory = async (req, res) => {
  try {
    const ItemCategory = mongoose.models.ItemCategory;

    const deleted = await ItemCategory.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Item category not found" });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("DELETE ITEM CATEGORY ERROR", err);
    res.status(500).json({ message: "Failed to delete item category" });
  }
};
