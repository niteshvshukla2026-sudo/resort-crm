// backend/src/controllers/itemCategory.controller.js
// ========================================
// ITEM CATEGORY CONTROLLER
// ========================================

const mongoose = require("mongoose");

const ItemCategory = mongoose.models.ItemCategory;

/**
 * GET /api/item-categories
 */
exports.list = async (req, res) => {
  try {
    const list = await ItemCategory.find()
      .sort({ createdAt: -1 })
      .lean();

    res.json(list);
  } catch (err) {
    console.error("LIST ITEM CATEGORY ERROR ❌", err);
    res.status(500).json({
      message: "Failed to load item categories",
    });
  }
};

/**
 * POST /api/item-categories
 */
exports.create = async (req, res) => {
  try {
    const { name, code, departmentCategory } = req.body;

    if (!name || !departmentCategory) {
      return res.status(400).json({
        message: "Name and Department are required",
      });
    }

    const doc = await ItemCategory.create({
      name,
      code,
      departmentCategory,
    });

    res.status(201).json(doc);
  } catch (err) {
    console.error("CREATE ITEM CATEGORY ERROR ❌", err);
    res.status(500).json({
      message: "Failed to create item category",
    });
  }
};

/**
 * PUT /api/item-categories/:id
 */
exports.update = async (req, res) => {
  try {
    const updated = await ItemCategory.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        message: "Item category not found",
      });
    }

    res.json(updated);
  } catch (err) {
    console.error("UPDATE ITEM CATEGORY ERROR ❌", err);
    res.status(500).json({
      message: "Failed to update item category",
    });
  }
};

/**
 * DELETE /api/item-categories/:id
 */
exports.remove = async (req, res) => {
  try {
    const deleted = await ItemCategory.findByIdAndDelete(
      req.params.id
    );

    if (!deleted) {
      return res.status(404).json({
        message: "Item category not found",
      });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("DELETE ITEM CATEGORY ERROR ❌", err);
    res.status(500).json({
      message: "Failed to delete item category",
    });
  }
};
