// backend/routes/storeRoutes.js
const express = require("express");
const Store = require("../models/storeModel");

const router = express.Router();

/**
 * GET /api/stores
 * Saare stores list karega
 */
router.get("/", async (req, res) => {
  try {
    const stores = await Store.find().sort({ resort: 1, name: 1 });
    res.json(stores);
  } catch (err) {
    console.error("GET /api/stores error:", err);
    res.status(500).json({ message: "Failed to fetch stores" });
  }
});

/**
 * POST /api/stores
 * Naya store create karega
 * Body: { resort, name, code? }
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
 * Existing store update karega
 */
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { resort, name, code } = req.body;

    if (!resort || !name) {
      return res.status(400).json({ message: "Resort and Store name are required" });
    }

    const updated = await Store.findByIdAndUpdate(
      id,
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
 * Store delete karega
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Store.findByIdAndDelete(id);
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
