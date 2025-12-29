const mongoose = require("mongoose");

// helper: simple store code generator (same behaviour as earlier)
const generateStoreCode = (name = "") =>
  name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6) || "STORE";

exports.listStores = async (req, res) => {
  try {
    const Store = mongoose.models.Store;

    const filter = {};
    if (req.query.resort && req.query.resort !== "ALL") {
      filter.resort = req.query.resort;
    }

    const stores = await Store.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    res.json(stores);
  } catch (err) {
    console.error("LIST STORES ERROR", err);
    res.status(500).json({ message: "Failed to load stores" });
  }
};

exports.createStore = async (req, res) => {
  try {
    const Store = mongoose.models.Store;

    const payload = {
      name: req.body.name,
      resort: req.body.resort,
      code: generateStoreCode(req.body.name),
    };

    const doc = await Store.create(payload);
    res.status(201).json(doc);
  } catch (err) {
    console.error("CREATE STORE ERROR", err);
    res.status(500).json({ message: "Failed to create store" });
  }
};

exports.updateStore = async (req, res) => {
  try {
    const Store = mongoose.models.Store;

    const payload = {
      name: req.body.name,
      resort: req.body.resort,
    };

    const updated = await Store.findByIdAndUpdate(
      req.params.id,
      { $set: payload },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Store not found" });
    }

    res.json(updated);
  } catch (err) {
    console.error("UPDATE STORE ERROR", err);
    res.status(500).json({ message: "Failed to update store" });
  }
};

exports.deleteStore = async (req, res) => {
  try {
    const Store = mongoose.models.Store;

    const deleted = await Store.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Store not found" });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("DELETE STORE ERROR", err);
    res.status(500).json({ message: "Failed to delete store" });
  }
};
