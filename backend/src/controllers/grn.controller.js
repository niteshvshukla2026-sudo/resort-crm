const GRN = require("../models/grn.model");
const Requisition = require("../models/requisition.model");

exports.createGRN = async (req, res) => {
  const { grnNo, receivedBy, receivedDate, challanNo, billNo, store, items } = req.body;

  const grn = new GRN({
    grnNo,
    receivedBy,
    receivedDate,
    challanNo,
    billNo,
    store,
    items,
  });

  await grn.save();

  await Requisition.findByIdAndUpdate(req.params.id, {
    status: "GRN_CREATED",
    grn: grn._id,
  });

  const updatedReq = await Requisition.findById(req.params.id).populate("grn");

  res.json({ requisition: updatedReq, grn });
};
// controllers/grn.controller.js
const GRN = require("../models/grn.model");
const Requisition = require("../models/requisition.model");
const PO = require("../models/po.model");
const Store = require("../models/store.model");

/**
 * CREATE GRN
 * Auto-detect resort:
 *   1) If PO exists → use PO.resort
 *   2) Else use store.resort
 */
exports.createGRN = async (req, res) => {
  try {
    const {
      grnNo,
      receivedBy,
      receivedDate,
      challanNo,
      billNo,
      store,
      po,      // optional — sent when GRN is created against a PO
      items,
    } = req.body;

    if (!grnNo || !store || !items || !receivedDate) {
      return res.status(400).json({
        message: "grnNo, store, items, and receivedDate are required",
      });
    }

    let resort = null;

    // 🔥 If PO is attached → auto-use PO.resort
    if (po) {
      const poDoc = await PO.findById(po);
      if (poDoc) {
        resort = poDoc.resort;
      }
    }

    // 🔥 If no PO → derive resort from Store
    if (!resort) {
      const storeDoc = await Store.findById(store);
      if (!storeDoc) {
        return res.status(400).json({ message: "Invalid store id" });
      }
      resort = storeDoc.resort;
    }

    // Create GRN
    const grn = new GRN({
      grnNo,
      receivedBy,
      receivedDate,
      challanNo,
      billNo,
      store,
      resort, // 🔥 required now
      po: po || null,
      items,
    });

    await grn.save();

    // Update requisition → mark GRN created
    if (req.params.id) {
      await Requisition.findByIdAndUpdate(req.params.id, {
        status: "GRN_CREATED",
        grn: grn._id,
      });
    }

    const populatedGRN = await GRN.findById(grn._id)
      .populate("store")
      .populate("resort")
      .populate("po")
      .populate("items.item");

    const updatedReq = req.params.id
      ? await Requisition.findById(req.params.id)
          .populate("grn")
          .populate("vendor")
          .populate("store")
          .populate("resort")
      : null;

    res.json({
      grn: populatedGRN,
      requisition: updatedReq,
    });
  } catch (err) {
    console.error("GRN create error:", err);
    res.status(500).json({ message: "Failed to create GRN" });
  }
};
