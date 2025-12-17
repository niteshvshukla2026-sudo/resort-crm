const express = require("express");
const router = express.Router();

const Requisition = require("../models/Requisition");
const PurchaseOrder = require("../models/PurchaseOrder");
const GRN = require("../models/GRN");

/**
 * =====================================================
 * GET /api/requisitions
 * =====================================================
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
      .populate("fromStore", "name")
      .populate("toStore", "name")
      .populate("store", "name")
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
 * =====================================================
 * POST /api/requisitions
 * =====================================================
 */
router.post("/", async (req, res) => {
  try {
    const payload = { ...req.body };

    payload.resort =
      payload.resort?._id ||
      payload.resort?.id ||
      payload.resort;

    if (!payload.resort)
      return res.status(400).json({ message: "Resort is required" });

    if (!payload.type)
      return res.status(400).json({ message: "Requisition type required" });

    if (!payload.lines || !payload.lines.length)
      return res.status(400).json({ message: "At least one item required" });

    payload.status = "PENDING";

    const requisition = await Requisition.create(payload);

    const populated = await Requisition.findById(requisition._id)
      .populate("resort", "name")
      .populate("department", "name")
      .populate("fromStore", "name")
      .populate("toStore", "name")
      .populate("store", "name")
      .populate("vendor", "name");

    res.status(201).json(populated);
  } catch (err) {
    console.error("POST /requisitions error", err);
    res.status(400).json({ message: err.message });
  }
});

/**
 * =====================================================
 * PUT /api/requisitions/:id
 * =====================================================
 */
router.put("/:id", async (req, res) => {
  try {
    const payload = { ...req.body };

    payload.resort =
      payload.resort?._id ||
      payload.resort?.id ||
      payload.resort;

    if (!payload.resort)
      return res.status(400).json({ message: "Resort is required" });

    const updated = await Requisition.findByIdAndUpdate(
      req.params.id,
      payload,
      { new: true }
    )
      .populate("resort", "name")
      .populate("department", "name")
      .populate("fromStore", "name")
      .populate("toStore", "name")
      .populate("store", "name")
      .populate("vendor", "name");

    if (!updated)
      return res.status(404).json({ message: "Requisition not found" });

    res.json(updated);
  } catch (err) {
    console.error("PUT /requisitions error", err);
    res.status(400).json({ message: err.message });
  }
});

/**
 * =====================================================
 * DELETE /api/requisitions/:id
 * =====================================================
 */
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Requisition.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ message: "Requisition not found" });

    res.json({ message: "Requisition deleted" });
  } catch (err) {
    console.error("DELETE /requisitions error", err);
    res.status(500).json({ message: "Failed to delete requisition" });
  }
});

/**
 * =====================================================
 * POST /api/requisitions/:id/approve
 * =====================================================
 */
router.post("/:id/approve", async (req, res) => {
  try {
    const r = await Requisition.findById(req.params.id);
    if (!r)
      return res.status(404).json({ message: "Requisition not found" });

    r.status = "APPROVED";
    await r.save();

    res.json(r);
  } catch (err) {
    res.status(500).json({ message: "Failed to approve requisition" });
  }
});

/**
 * =====================================================
 * POST /api/requisitions/:id/create-po
 * =====================================================
 */
router.post("/:id/create-po", async (req, res) => {
  try {
    const requisition = await Requisition.findById(req.params.id)
      .populate("vendor")
      .populate("resort");

    if (!requisition)
      return res.status(404).json({ message: "Requisition not found" });

    if (requisition.type !== "VENDOR")
      return res.status(400).json({ message: "PO only for vendor requisition" });

    if (requisition.status !== "APPROVED")
      return res.status(400).json({ message: "Requisition not approved" });

    if (requisition.po)
      return res.status(400).json({ message: "PO already created" });

    if (!requisition.vendor)
      return res.status(400).json({ message: "Vendor missing in requisition" });

    const po = await PurchaseOrder.create({
      requisition: requisition._id,
      vendor: requisition.vendor._id,
      resort: requisition.resort._id,
      items: requisition.lines,
      status: "CREATED",
      createdAt: new Date(),
    });

    requisition.po = po._id;
    requisition.status = "PO_CREATED";
    await requisition.save();

    res.json({
      message: "PO created successfully",
      po,
      requisition,
    });
  } catch (err) {
    console.error("CREATE PO error", err);
    res.status(500).json({ message: "Failed to create PO" });
  }
});

/**
 * =====================================================
 * POST /api/requisitions/:id/create-grn
 * =====================================================
 */
router.post("/:id/create-grn", async (req, res) => {
  try {
    const requisition = await Requisition.findById(req.params.id)
      .populate("po");

    if (!requisition)
      return res.status(404).json({ message: "Requisition not found" });

    if (!requisition.po)
      return res.status(400).json({ message: "PO not created yet" });

    if (requisition.grn)
      return res.status(400).json({ message: "GRN already created" });

    const grn = await GRN.create({
      requisition: requisition._id,
      po: requisition.po._id,
      items: requisition.lines,
      receivedDate: new Date(),
    });

    requisition.grn = grn._id;
    requisition.status = "GRN_CREATED";
    await requisition.save();

    res.json({
      message: "GRN created successfully",
      grn,
      requisition,
    });
  } catch (err) {
    console.error("CREATE GRN error", err);
    res.status(500).json({ message: "Failed to create GRN" });
  }
});

module.exports = router;
