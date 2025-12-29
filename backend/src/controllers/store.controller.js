// backend/src/controllers/store.controller.js
const mongoose = require("mongoose");
const Store = mongoose.model("store");

// ===============================
// GET /api/stores?resort=ID
// ===============================
exports.list = async (req, res) => {
  try {
    const { resort } = req.query;

    const filter = {};
    if (resort) {
      filter.resort = resort;
    }

    const stores = await Store.find(filter)
      .populate("resort", "name code")
      .sort({ createdAt: -1 })
      .lean();

    res.json(stores);
  } catch (err) {
    console.error("LIST STORES ERROR ❌", err);
    res.status(500).json({ message: "Failed to load stores" });
  }
};

// ===============================
// POST /api/stores
// ===============================
exports.create = async (req, res) => {
  try {
    const { name, resort } = req.body;

    if (!name || !resort) {
      return res
        .status(400)
        .json({ message: "Store name and resort required" });
    }

    const store = await Store.create({
      name,
      resort,
    });

    res.status(201).json(store);
  } catch (err) {
    console.error("CREATE STORE ERROR ❌", err);
    res.status(500).json({ message: "Failed to create store" });
  }
};

// ===============================
// PUT /api/stores/:id
// ===============================
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, resort } = req.body;

    const store = await Store.findByIdAndUpdate(
      id,
      { name, resort },
      { new: true }
    );

    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }

    res.json(store);
  } catch (err) {
    console.error("UPDATE STORE ERROR ❌", err);
    res.status(500).json({ message: "Failed to update store" });
  }
};

// ===============================
// DELETE /api/stores/:id
// ===============================
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;

    const store = await Store.findByIdAndDelete(id);
    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("DELETE STORE ERROR ❌", err);
    res.status(500).json({ message: "Failed to delete store" });
  }
};
