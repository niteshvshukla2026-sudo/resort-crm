import Store from "../models/Store.js";

/**
 * POST /api/stores
 * Create new store (resort-wise)
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
      name: name.trim(),
      code: code?.trim() || "",
    });

    res.status(201).json(store);
  } catch (err) {
    console.error("createStore error:", err);
    res.status(500).json({ message: "Failed to create store" });
  }
};

/**
 * GET /api/stores
 * ✅ Resort-wise store listing
 * Query: ?resort=<resortId>
 */
export const listStores = async (req, res) => {
  try {
    const filter = {};

    // 🔥 MAIN FIX
    if (req.query.resort) {
      filter.resort = req.query.resort;
    }

    const stores = await Store.find(filter)
      .sort({ name: 1 })
      .lean();

    res.json(stores);
  } catch (err) {
    console.error("listStores error:", err);
    res.status(500).json({ message: "Failed to fetch stores" });
  }
};

/**
 * PUT /api/stores/:id
 * Update store
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

    const updated = await Store.findByIdAndUpdate(
      id,
      {
        resort,
        name: name.trim(),
        code: code?.trim() || "",
      },
      { new: true, runValidators: true }
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
    const deleted = await Store.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Store not found" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("deleteStore error:", err);
    res.status(500).json({ message: "Failed to delete store" });
  }
};
