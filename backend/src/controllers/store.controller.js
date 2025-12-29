// backend/src/controllers/store.controller.js
// ✅ PURE CJS | PRODUCTION SAFE

const Store = require("../models/store.model");

/**
 * GET /api/stores
 */
exports.list = async (req, res) => {
  try {
    const stores = await Store.find()
      .populate("resort", "name code")
      .sort({ createdAt: -1 })
      .lean();

    return res.json(stores);
  } catch (err) {
    console.error("LIST STORES ERROR ❌", err);
    return res.status(500).json({ message: "Failed to load stores" });
  }
};

/**
 * POST /api/stores
 */
exports.create = async (req, res) => {
  try {
    const doc = await Store.create(req.body);
    return res.status(201).json(doc);
  } catch (err) {
    console.error("CREATE STORE ERROR ❌", err);
    return res.status(500).json({ message: "Failed to create store" });
  }
};

/**
 * PUT /api/stores/:id
 */
exports.update = async (req, res) => {
  try {
    const updated = await Store.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Store not found" });
    }

    return res.json(updated);
  } catch (err) {
    console.error("UPDATE STORE ERROR ❌", err);
    return res.status(500).json({ message: "Failed to update store" });
  }
};

/**
 * DELETE /api/stores/:id
 */
exports.remove = async (req, res) => {
  try {
    const deleted = await Store.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Store not found" });
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error("DELETE STORE ERROR ❌", err);
    return res.status(500).json({ message: "Failed to delete store" });
  }
};
