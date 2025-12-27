// controllers/po.controller.js
const mongoose = require("mongoose");
const PO = require("../models/po.model");
const Requisition = require("../models/requisition.model");
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

exports.list = async (req, res) => {
  try {
    const docs = await PO.find()
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

exports.create = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const {
      poNo,
      vendor,
      resort,
      deliverTo,
      poDate,
      items = [],
      subTotal,
      taxPercent = 0,
      taxAmount,
      total,
      status,
      requisition: requisitionId,
    } = req.body;

    if (!poNo || !vendor || !resort || !deliverTo) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json({ message: "poNo, vendor, resort and deliverTo are required" });
    }

    // Normalize totals
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

    // Link to requisition (optional)
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

exports.update = async (req, res) => {
  try {
    const payload = { ...req.body };

    // If items/taxPercent provided, recalc before saving
    if (payload.items || payload.taxPercent !== undefined) {
      const existing = await PO.findById(req.params.id);
      if (!existing) return res.status(404).json({ message: "PO not found" });
      existing.items = payload.items || existing.items;
      if (payload.taxPercent !== undefined) existing.taxPercent = payload.taxPercent;
      recalcPoTotals(existing);
      Object.assign(existing, payload);
      await existing.save();
      const pop = await PO.findById(existing._id)
        .populate("vendor")
        .populate("resort")
        .populate("deliverTo");
      return res.json(pop);
    }

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

    // Unlink from any requisitions pointing to this PO
    await Requisition.updateMany({ po: po._id }, { $unset: { po: "" }, $set: { status: "PENDING" } }, { session });

    // Remove PO
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
