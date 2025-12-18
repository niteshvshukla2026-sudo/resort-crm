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

    // 1️⃣ Requisition fetch karo with PO
    const requisition = await Requisition.findById(req.params.id).populate("po");

    if (!requisition) {
      return res.status(404).json({ message: "Requisition not found" });
    }

    if (!requisition.po) {
      return res.status(400).json({ message: "PO not linked with requisition" });
    }

    // 2️⃣ GRN create karo (❌ poId nahi, ✅ po)
    const grn = new GRN({
      grnNo,
      requisition: requisition._id,
      po: requisition.po._id,     // ⭐ MOST IMPORTANT LINE
      store,
      receivedBy,
      receivedDate,
      challanNo,
      billNo,
      items,
    });

    await grn.save();

    // 3️⃣ Requisition update
    requisition.status = "GRN_CREATED";
    requisition.grn = grn._id;
    await requisition.save();

    return res.status(201).json({ grn });
  } catch (err) {
    console.error("Create GRN Error:", err);
    return res.status(500).json({
      message: "Failed to create GRN",
      error: err.message,
    });
  }
};
