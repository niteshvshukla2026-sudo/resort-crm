import Store from "../models/storeModel.js";

/**
 * CREATE STORE
 * POST /api/stores
 * body: { name, code, resort }
 */
export const createStore = async (req, res) => {
  try {
    const { name, code, resort } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Store name is required" });
    }

    if (!code || !code.trim()) {
      return res.status(400).json({ message: "Store code is required" });
    }

    if (!resort) {
      return res.status(400).json({ message: "Resort is required" });
    }

    const payload = {
      name: name.trim(),
      code: code.trim().toUpperCase(),
      resort,
    };

    // 🔐 Unique store code per resort
    const exists = await Store.findOne({
      resort: payload.resort,
      code: payload.code,
    });

    if (exists) {
      return res.status(409).json({
        message: "Store code already exists for this resort",
      });
    }

    const created = await Store.create(payload);
    res.status(201).json(created);
  } catch (err) {
    console.error("createStore error", err);
    res.status(500).json({ message: "Failed to create store" });
  }
};

/**
 * LIST STORES (RESORT-WISE)
 * GET /api/stores?resort=RESORT_ID
 */
export const listStores = async (req, res) => {
  try {
    const { resort } = req.query;

    const filter = {};
    if (resort && resort !== "ALL") {
      filter.resort = resort;
    }

    const docs = await Store.find(filter)
      .populate("resort", "name")
      .sort({ createdAt: -1 })
      .lean();

    res.json(docs);
  } catch (err) {
    console.error("listStores error", err);
    res.status(500).json({ message: "Failed to load stores" });
  }
};
