// controllers/po.controller.js
const mongoose = require("mongoose");
const PO = require("../models/po.model");
const Requisition = require("../models/requisition.model");
const Store = require("../models/store.model"); // 🔥 Needed to auto-detect resort
const GRN = require("../models/grn.model");

/**
 * helper: recalc PO totals from items array
 */
function recalcPoTotals(po) {
  const sub = (po.items || []).reduce((s, it) => s + Number(it.amount || 0), 0);
  const taxAmount = ((po.taxPercent || 0) / 100) * sub;
  const total = sub + taxAmount;
  po.subTotal = sub;
  po.taxAmount = taxAmount;
  po.total = total;
  return po;
}

/**
 * LIST POs
 * Supports: /api/po?resort=ID
 */
exports.list = async (req, res) => {
  try {
    const filter = {};

    // 🔥 Resort-wise filtering
    if (req.query.resort) {
      filter.resort = req.query.resort;
    }

    const docs = await PO.find(filter)
      .populate("vendor")
      .populate("resort")
      .populate("deliverTo")
      .sort({ createdAt: -1 })
      .lean();

    res.json(docs);
  } catch (err) {
    console.error("PO list error", err);
    res.status(500).json({ message: "Failed to list POs" });
  }
};

/**
 * GET ONE PO
 */
exports.getOne = async (req, res) => {
  try {
    const po = await PO.findById(req.params.id)
      .populate("vendor")
      .populate("resort")
      .populate("deliverTo")
      .lean();

    if (!po) return res.status(404).json({ message: "PO not found" });
    res.json(po);
  } catch (err) {
    console.error("PO get error", err);
    res.status(500).json({ message: "Failed to fetch PO" });
  }
};

/**
 * CREATE PO
 * Auto-detect resort using store (deliverTo) if not provided
 */
exports.create = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    let {
      poNo,
      vendor,
      resort,
      deliverTo,
      poDate,
      items = [],
      taxPercent = 0,
      status,
      requisition: requisitionId,
    } = req.body;

    if (!poNo || !vendor || !deliverTo) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        message: "poNo, vendor, and deliverTo (store) are required",
      });
    }

    // 🔥 Auto-fill resort based on Store if missing
    if (!resort) {
      const store = await Store.findById(deliverTo);
      if (store) resort = store.resort;
    }

    if (!resort) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        message: "Resort is missing and could not be auto-detected.",
      });
    }

    // Prepare PO object
    const base = {
      poNo,
      vendor,
      resort,
      deliverTo,
      poDate: poDate ? new Date(poDate) : new Date(),
      items,
      taxPercent: Number(taxPercent || 0),
      status: status || "CREATED",
    };

    const poDoc = recalcPoTotals(base);

    const created = await PO.create([poDoc], { session });
    const po = created[0];

    // LINK PO → REQUISITION
    if (requisitionId) {
      await Requisition.findByIdAndUpdate(
        requisitionId,
        { po: po._id, status: "PO_CREATED" },
        { session }
      );
    }

    await session.commitTransaction();
    session.endSession();

    const populated = await PO.findById(po._id)
      .populate("vendor")
      .populate("resort")
      .populate("deliverTo");

    res.status(201).json(populated);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    console.error("PO create error", err);

    if (err.code === 11000) {
      return res.status(400).json({ message: "PO number already exists" });
    }

    res.status(500).json({ message: "Failed to create PO" });
  }
};

/**
 * UPDATE PO
 * Recalculates totals when needed
 */
exports.update = async (req, res) => {
  try {
    const payload = { ...req.body };

    // 🔥 Auto-set resort if store is changed
    if (payload.deliverTo) {
      const store = await Store.findById(payload.deliverTo);
      if (store) payload.resort = store.resort;
    }

    // If items or tax changed, recalc totals
    if (payload.items || payload.taxPercent !== undefined) {
      const existing = await PO.findById(req.params.id);
      if (!existing) return res.status(404).json({ message: "PO not found" });

      existing.items = payload.items || existing.items;
      if (payload.taxPercent !== undefined)
        existing.taxPercent = payload.taxPercent;

      recalcPoTotals(existing);
      Object.assign(existing, payload);
      await existing.save();

      const pop = await PO.findById(existing._id)
        .populate("vendor")
        .populate("resort")
        .populate("deliverTo");

      return res.json(pop);
    }

    // SIMPLE UPDATE
    const updated = await PO.findByIdAndUpdate(req.params.id, payload, {
      new: true,
    })
      .populate("vendor")
      .populate("resort")
      .populate("deliverTo");

    if (!updated) return res.status(404).json({ message: "PO not found" });
    res.json(updated);
  } catch (err) {
    console.error("PO update error", err);
    res.status(500).json({ message: "Failed to update PO" });
  }
};

/**
 * DELETE PO
 * Rolls back link on requisition
 */
exports.delete = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const po = await PO.findById(req.params.id).session(session);
    if (!po) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "PO not found" });
    }

    // Remove PO from requisition
    await Requisition.updateMany(
      { po: po._id },
      { $unset: { po: "" }, $set: { status: "PENDING" } },
      { session }
    );

    await PO.deleteOne({ _id: po._id }).session(session);

    await session.commitTransaction();
    session.endSession();

    res.json({ ok: true });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    console.error("PO delete error", err);
    res.status(500).json({ message: "Failed to delete PO" });
  }
};
