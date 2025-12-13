import Store from "../models/Store.js";

/**
 * GET /api/stores
 * Resort-wise stores list
 */
export const listStores = async (req, res) => {
  try {
    const { resort } = req.query;

    console.log("STORE LIST FILTER:", resort); // 🔍 DEBUG

    const filter = {};

    // 🔥 IMPORTANT FIX
    if (resort && resort !== "ALL") {
      filter.resort = resort;
    }

    const stores = await Store.find(filter).sort({ name: 1 });

    res.json(stores);
  } catch (err) {
    console.error("listStores error:", err);
    res.status(500).json({ message: "Failed to fetch stores" });
  }
};

/**
 * POST /api/stores
 */
export const createStore = async (req, res) => {
  try {
    const { resort, name, code } = req.body;

    if (!resort || !name) {
      return res
        .status(400)
        .json({ message: "Resort and Store name required" });
    }

    const store = await Store.create({
      resort,
      name,
      code: code || "",
    });

    res.status(201).json(store);
  } catch (err) {
    console.error("createStore error:", err);
    res.status(500).json({ message: "Failed to create store" });
  }
};

/**
 * PUT /api/stores/:id
 */
export const updateStore = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await Store.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    if (!updated) {
      return res.status(404).json({ message: "Store not found" });
    }

    res.json(updated);
  } catch (err) {
    console.error("updateStore error:", err);
    res.status(500).json({ message: "Failed to update store" });
  }
};

/**
 * DELETE /api/stores/:id
 */
export const deleteStore = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Store.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Store not found" });
    }

    res.json({ message: "Store deleted" });
  } catch (err) {
    console.error("deleteStore error:", err);
    res.status(500).json({ message: "Failed to delete store" });
  }
};
