const GRN = require("../models/grn.model");
const Requisition = require("../models/requisition.model");

exports.createGRN = async (req, res) => {
  try {
    const {
      grnNo,
      receivedBy,
      receivedDate,
      challanNo,
      billNo,
      store,
      items,
    } = req.body;

    // 🔍 Find requisition with PO
    const requisition = await Requisition.findById(req.params.id).populate("po");

    if (!requisition) {
      return res.status(404).json({ message: "Requisition not found" });
    }

    if (!requisition.po) {
      return res.status(400).json({ message: "PO not linked with requisition" });
    }

    // ✅ CREATE GRN (MODEL FIELD NAMES EXACT)
    const grn = new GRN({
      grnNo,
      requisition: requisition._id,
      po: requisition.po._id,          // ✅ CORRECT (NOT poId)
      store,
      receivedBy,
      receivedDate,
      challanNo,
      billNo,
      items,
    });

    await grn.save();

    // 🔄 Update requisition
    requisition.status = "GRN_CREATED";
    requisition.grn = grn._id;
    await requisition.save();

    res.status(201).json({
      message: "GRN created successfully",
      grn,
    });
  } catch (err) {
    console.error("Create GRN error", err);
    res.status(500).json({
      message: "Failed to create GRN",
      error: err.message,
    });
  }
};
