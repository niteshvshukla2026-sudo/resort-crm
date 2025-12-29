// backend/src/controllers/item.controller.js
// ========================================
// ITEM CONTROLLER
// ========================================

const mongoose = require("mongoose");

const Item = mongoose.models.Item;

/**
 * GET /api/items
 */
exports.list = async (req, res) => {
  try {
    const items = await Item.find()
      .populate("itemCategory", "name code")
      .sort({ createdAt: -1 })
      .lean();

    res.json(items);
  } catch (err) {
    console.error("LIST ITEMS ERROR ❌", err);
    res.status(500).json({
      message: "Failed to load items",
    });
  }
};

/**
 * POST /api/items
 */
exports.create = async (req, res) => {
  try {
    const {
      name,
      code,
      itemCategory,
      uom,
      brand,
      indicativePrice,
    } = req.body;

    if (!name || !code || !uom) {
      return res.status(400).json({
        message: "Name, Code and UOM are required",
      });
    }

    const doc = await Item.create({
      name,
      code,
      itemCategory,
      uom,
      brand,
      indicativePrice,
    });

    const populated = await doc.populate(
      "itemCategory",
      "name code"
    );

    res.status(201).json(populated);
  } catch (err) {
    console.error("CREATE ITEM ERROR ❌", err);
    res.status(500).json({
      message: "Failed to create item",
    });
  }
};

/**
 * PUT /api/items/:id
 */
exports.update = async (req, res) => {
  try {
    const updated = await Item.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    ).populate("itemCategory", "name code");

    if (!updated) {
      return res.status(404).json({
        message: "Item not found",
      });
    }

    res.json(updated);
  } catch (err) {
    console.error("UPDATE ITEM ERROR ❌", err);
    res.status(500).json({
      message: "Failed to update item",
    });
  }
};

/**
 * DELETE /api/items/:id
 */
exports.remove = async (req, res) => {
  try {
    const deleted = await Item.findByIdAndDelete(
      req.params.id
    );

    if (!deleted) {
      return res.status(404).json({
        message: "Item not found",
      });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("DELETE ITEM ERROR ❌", err);
    res.status(500).json({
      message: "Failed to delete item",
    });
  }
};
