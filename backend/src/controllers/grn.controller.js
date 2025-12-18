const GRN = require("../models/grn.model");
const Requisition = require("../models/requisition.model");

exports.createGRN = async (req, res) => {
  try {
    const { grnNo, receivedBy, receivedDate, challanNo, billNo, store, items } =
      req.body;

    // 1️⃣ Find requisition
    const requisition = await Requisition.findById(req.params.id);

    if (!requisition) {
      return res.status(404).json({ message: "Requisition not found" });
    }

    // 2️⃣ PO MUST EXIST
    if (!requisition.po) {
      return res.status(400).json({
        message: "PO not found for this requisition",
      });
    }

    // 3️⃣ Create GRN WITH poId ✅
    const grn = new GRN({
      grnNo,
      poId: requisition.po,        // 🔥 FIX
      requisition: requisition._id,
      receivedBy,
      receivedDate,
      challanNo,
      billNo,
      store,
      items,
      status: "CREATED",
    });

    await grn.save();

    // 4️⃣ Update requisition
    requisition.status = "GRN_CREATED";
    requisition.grn = grn._id;
    await requisition.save();

    res.status(201).json({ grn });
  } catch (err) {
    console.error("Create GRN Error:", err);
    res.status(500).json({
      message: "Failed to create GRN",
      error: err.message,
    });
  }
};
