const express = require("express");
const router = express.Router();
const Requisition = require("../models/Requisition");

/**
 * ==========================================
 * GET /api/requisitions
 * Optional query:
 *   ?resort=RESORT_ID
 * ==========================================
 */
router.get("/", async (req, res) => {
  try {
    const { resort } = req.query;

    const query = {};

    // 🔥 GLOBAL RESORT FILTER
    if (resort && resort !== "ALL") {
      query.resort = resort;
    }

    const list = await Requisition.find(query)
      .populate("resort", "name")
      .populate("department", "name")
      .populate("fromStore", "name resort")
      .populate("toStore", "name resort")
      .populate("store", "name resort")
      .populate("vendor", "name")
      .sort({ createdAt: -1 });

    res.json(list);
  } catch (err) {
    console.error("GET /requisitions error", err);
    res.status(500).json({ message: "Failed to fetch requisitions" });
  }
});

/**
 * ==========================================
 * POST /api/requisitions (CREATE)
 * ==========================================
 */
router.post("/", async (req, res) => {
  try {
    const payload = { ...req.body };

    // ❌ RESORT IS MANDATORY
    if (!payload.resort) {
      return res.status(400).json({
        message: "Resort is required to create requisition",
      });
    }

    if (!payload.type) {
      return res.status(400).json({
        message: "Requisition type is required",
      });
    }

    if (!payload.lines || !payload.lines.length) {
      return res.status(400).json({
        message: "At least one item line is required",
      });
    }

    payload.status = "PENDING";

    const requisition = await Requisition.create(payload);

    const populated = await Requisition.findById(requisition._id)
      .populate("resort", "name")
      .populate("department", "name")
      .populate("fromStore", "name resort")
      .populate("toStore", "name resort")
      .populate("store", "name resort")
      .populate("vendor", "name");

    res.status(201).json(populated);
  } catch (err) {
    console.error("POST /requisitions error", err);
    res.status(400).json({ message: err.message });
  }
});

/**
 * ==========================================
 * PUT /api/requisitions/:id (UPDATE)
 * ==========================================
 */
router.put("/:id", async (req, res) => {
  try {
    const payload = { ...req.body };

    // ❌ RESORT CANNOT BE REMOVED
    if (!payload.resort) {
      return res.status(400).json({
        message: "Resort is required",
      });
    }

    const updated = await Requisition.findByIdAndUpdate(
      req.params.id,
      payload,
      { new: true }
    )
      .populate("resort", "name")
      .populate("department", "name")
      .populate("fromStore", "name resort")
      .populate("toStore", "name resort")
      .populate("store", "name resort")
      .populate("vendor", "name");

    if (!updated) {
      return res.status(404).json({ message: "Requisition not found" });
    }

    res.json(updated);
  } catch (err) {
    console.error("PUT /requisitions error", err);
    res.status(400).json({ message: err.message });
  }
});

/**
 * ==========================================
 * DELETE /api/requisitions/:id
 * ==========================================
 */
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Requisition.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Requisition not found" });
    }
    res.json({ message: "Requisition deleted" });
  } catch (err) {
    console.error("DELETE /requisitions error", err);
    res.status(500).json({ message: "Failed to delete requisition" });
  }
});

module.exports = router;
