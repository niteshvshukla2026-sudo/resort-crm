import Store from "../models/storeModel.js";

/**
 * GET /api/stores
 * Resort-wise store list
 * /api/stores?resort=<resortId>
 */
export const listStores = async (req, res) => {
  try {
    const { resort } = req.query;

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
        .json({ message: "Resort and Store name are required" });
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
    const { resort, name, code } = req.body;

    if (!resort || !name) {
      return res
        .status(400)
        .json({ message: "Resort and Store name are required" });
    }

    const store = await Store.findByIdAndUpdate(
      id,
      { resort, name, code: code || "" },
      { new: true, runValidators: true }
    );

    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }

    res.json(store);
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

    const store = await Store.findByIdAndDelete(id);
    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }

    res.json({ message: "Store deleted" });
  } catch (err) {
    console.error("deleteStore error:", err);
    res.status(500).json({ message: "Failed to delete store" });
  }
};
