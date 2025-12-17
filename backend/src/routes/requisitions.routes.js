const express = require("express");
const router = express.Router();

const Requisition = require("../models/Requisition");
const PurchaseOrder = require("../models/PurchaseOrder");
const GRN = require("../models/GRN");

/**
 * ==========================================
 * GET /api/requisitions
 * ?resort=RESORT_ID
 * ==========================================
 */
router.get("/", async (req, res) => {
  try {
    const { resort } = req.query;

    const query = {};
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
      .populate("po")
      .populate("grn")
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

    if (!payload.resort) {
      return res.status(400).json({
        message: "Resort is required to create requisition",
      });
    }

    // 🔥 normalize resort id
    payload.resort =
      payload.resort?._id ||
      payload.resort?.id ||
      payload.resort;

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

    if (!payload.resort) {
      return res.status(400).json({
        message: "Resort is required",
      });
    }

    payload.resort =
      payload.resort?._id ||
      payload.resort?.id ||
      payload.resort;

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
 * POST /api/requisitions/:id/approve
 * ==========================================
 */
router.post("/:id/approve", async (req, res) => {
  try {
    const reqDoc = await Requisition.findById(req.params.id);
    if (!reqDoc) return res.status(404).json({ message: "Requisition not found" });

    reqDoc.status = "APPROVED";
    await reqDoc.save();

    res.json(reqDoc);
  } catch (err) {
    console.error("approve error", err);
    res.status(500).json({ message: "Failed to approve requisition" });
  }
});

/**
 * ==========================================
 * POST /api/requisitions/:id/create-po
 * ==========================================
 */
router.post("/:id/create-po", async (req, res) => {
  try {
    const requisition = await Requisition.findById(req.params.id);

    if (!requisition) {
      return res.status(404).json({ message: "Requisition not found" });
    }

    if (!requisition.resort) {
      return res.status(400).json({
        message: "Requisition has no resort assigned",
      });
    }

    if (requisition.po) {
      return res.status(400).json({ message: "PO already created" });
    }

    const payload = {
      ...req.body,
      resort: requisition.resort, // 🔥 force resort
    };

    const po = await PurchaseOrder.create(payload);

    requisition.po = po._id;
    requisition.status = "PO_CREATED";
    await requisition.save();

    res.json({ requisition, po });
  } catch (err) {
    console.error("create PO error", err);
    res.status(500).json({ message: "Failed to create PO" });
  }
});

/**
 * ==========================================
 * POST /api/requisitions/:id/create-grn
 * ==========================================
 */
router.post("/:id/create-grn", async (req, res) => {
  try {
    const requisition = await Requisition.findById(req.params.id);

    if (!requisition) {
      return res.status(404).json({ message: "Requisition not found" });
    }

    if (!requisition.resort) {
      return res.status(400).json({
        message: "Requisition has no resort assigned",
      });
    }

    if (requisition.grn) {
      return res.status(400).json({ message: "GRN already created" });
    }

    const payload = {
      ...req.body,
      resort: requisition.resort, // 🔥 force resort
    };

    const grn = await GRN.create(payload);

    requisition.grn = grn._id;
    requisition.status = "GRN_CREATED";
    await requisition.save();

    res.json({ requisition, grn });
  } catch (err) {
    console.error("create GRN error", err);
    res.status(500).json({ message: "Failed to create GRN" });
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
