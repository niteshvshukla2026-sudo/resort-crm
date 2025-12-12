// controllers/store.controller.js
import Store from "../models/Store.js";

/**
 * CREATE STORE
 * Ensures resort is ObjectId and valid
 */
export const createStore = async (req, res) => {
  try {
    const { resort, name, code } = req.body;

    if (!resort || !name) {
      return res.status(400).json({
        message: "resort and name are required",
      });
    }

    // Create store
    const store = await Store.create({
      resort,
      name,
      code: code || "",
    });

    // Return populated store
    const populated = await Store.findById(store._id).populate(
      "resort",
      "name code"
    );

    res.status(201).json(populated);
  } catch (err) {
    console.error("Create Store Error:", err);
    res.status(500).json({ message: "Failed to create store" });
  }
};

/**
 * LIST STORES
 * Supports filtering: /stores?resort=ID
 */
export const listStores = async (req, res) => {
  try {
    const filter = {};

    // 🔥 Resort-wise filtering
    if (req.query.resort) {
      filter.resort = req.query.resort;
    }

    const stores = await Store.find(filter)
      .populate("resort", "name code")
      .sort({ createdAt: -1 });

    res.json(stores);
  } catch (err) {
    console.error("List Stores Error:", err);
    res.status(500).json({ message: "Failed to fetch stores" });
  }
};
