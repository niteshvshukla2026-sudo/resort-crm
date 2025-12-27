const express = require("express");
const router = express.Router();
mongoose.deleteModel(/Grn/i);

const Requisition = require("../models/Requisition");
const PurchaseOrder = require("../models/PurchaseOrder");
const GRN = require("../models/Grn");

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
      .populate("vendor", "name")
      .populate("po")
      .populate("grn");

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
      .populate("vendor", "name")
      .populate("po")
      .populate("grn");

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

    const populated = await Requisition.findById(r._id)
      .populate("po")
      .populate("grn");

    res.json(populated);
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
      .populate("resort")
      .populate("po")
      .populate("grn");

    if (!requisition)
      return res.status(404).json({ message: "Requisition not found" });

    if (requisition.type !== "VENDOR")
      return res.status(400).json({ message: "PO only for vendor requisition" });

    if (requisition.status !== "APPROVED")
      return res.status(400).json({ message: "Requisition not approved" });

    if (requisition.po || requisition.grn)
      return res.status(400).json({
        message: "PO or GRN already created for this requisition",
      });

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

    const populated = await Requisition.findById(requisition._id)
      .populate("po")
      .populate("grn");

    res.json({ po, requisition: populated });
  } catch (err) {
    console.error("CREATE PO error", err);
    res.status(500).json({ message: "Failed to create PO" });
  }
});

// CREATE GRN FROM REQUISITION


router.post("/api/requisitions/:id/create-grn", async (req, res) => {
  try {
    const requisitionId = req.params.id;
    const {
      grnNo,
      receivedBy,
      receivedDate,
      challanNo,
      billNo,
      store,
      items,
    } = req.body;

    if (!grnNo || !receivedDate || !challanNo || !store) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Items are required" });
    }

    const requisition = await Requisition.findById(requisitionId);
    if (!requisition) {
      return res.status(404).json({ message: "Requisition not found" });
    }

    // ✅ NO poId HERE
    const grn = await Grn.create({
      grnNo,
      requisition: requisition._id,
      resort: requisition.resort,
      store,
      receivedBy,
      receivedDate,
      challanNo,
      billNo,
      items,
    });

    requisition.grn = grn._id;
    requisition.status = "GRN_CREATED";
    await requisition.save();

    res.status(201).json(grn);
  } catch (err) {
    console.error("Create GRN error:", err);
    res.status(500).json({
      message: "Failed to create GRN",
      error: err.message,
    });
  }
});