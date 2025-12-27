import Store from "../models/storeModel.js";

/**
 * GET /api/stores
 * Resort-wise stores
 */
export const listStores = async (req, res) => {
  try {
    const { resort } = req.query;

    // 🔥 IMPORTANT: RESORT FILTER
    const filter = {};

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
    const { name, code, resort } = req.body;

    if (!name || !resort) {
      return res
        .status(400)
        .json({ message: "Store name and resort are required" });
    }

    const store = await Store.create({
      name: name.trim(),
      code: code?.trim() || "",
      resort,
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
    const { name, code, resort } = req.body;

    const updated = await Store.findByIdAndUpdate(
      id,
      { name, code, resort },
      { new: true }
    );

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
