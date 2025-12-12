// backend/routes/storeRoutes.js
const express = require("express");
const mongoose = require("mongoose");
const Store = require("../models/storeModel");
const Resort = require("../models/resortModel"); // only needed for name → id resolution

const router = express.Router();

/**
 * GET /api/stores
 * Supports filters:
 *  - resort=<resortId>
 *  - search=<text>   (store name OR code)
 */
router.get("/", async (req, res) => {
  try {
    const { resort, search } = req.query;

    const filter = {};

    // Resort-wise filtering
    if (resort) {
      if (mongoose.Types.ObjectId.isValid(resort)) {
        // direct ObjectId
        filter.resort = resort;
      } else {
        // try to match resort by name if frontend accidentally sends name
        const r = await Resort.findOne({
          name: new RegExp(`^${String(resort).trim()}$`, "i"),
        }).lean();

        filter.resort = r?._id || resort; // fallback to raw
      }
    }

    // Search filter
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { code: { $regex: search, $options: "i" } },
      ];
    }

    const stores = await Store.find(filter)
      .sort({ resort: 1, name: 1 })
      .lean();

    res.json(stores);
  } catch (err) {
    console.error("GET /api/stores error:", err);
    res.status(500).json({ message: "Failed to fetch stores" });
  }
});

/**
 * POST /api/stores
 * Create store
 */
router.post("/", async (req, res) => {
  try {
    const { resort, name, code } = req.body;

    if (!resort || !name) {
      return res.status(400).json({ message: "Resort and Store name are required" });
    }

    const store = new Store({
      resort,
      name,
      code: code || "",
    });

    const saved = await store.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error("POST /api/stores error:", err);
    res.status(500).json({ message: "Failed to create store" });
  }
});

/**
 * PUT /api/stores/:id
 * Update existing store
 */
router.put("/:id", async (req, res) => {
  try {
    const { resort, name, code } = req.body;

    if (!resort || !name) {
      return res.status(400).json({ message: "Resort and Store name are required" });
    }

    const updated = await Store.findByIdAndUpdate(
      req.params.id,
      { resort, name, code: code || "" },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Store not found" });
    }

    res.json(updated);
  } catch (err) {
    console.error("PUT /api/stores/:id error:", err);
    res.status(500).json({ message: "Failed to update store" });
  }
});

/**
 * DELETE /api/stores/:id
 */
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Store.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Store not found" });
    }

    res.json({ message: "Store deleted" });
  } catch (err) {
    console.error("DELETE /api/stores/:id error:", err);
    res.status(500).json({ message: "Failed to delete store" });
  }
});

module.exports = router;
