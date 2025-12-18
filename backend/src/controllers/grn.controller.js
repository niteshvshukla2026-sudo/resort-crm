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

    const requisition = await Requisition.findById(req.params.id);

    if (!requisition) {
      return res.status(404).json({ message: "Requisition not found" });
    }

    // ✅ CREATE GRN WITH ALL REQUIRED LINKS
    const grn = await GRN.create({
      grnNo,
      receivedBy,
      receivedDate,
      challanNo,
      billNo,
      store,
      items,

      // 🔥 MOST IMPORTANT
      resort: requisition.resort,
      vendor: requisition.vendor,
      requisition: requisition._id,
      status: "CREATED",
    });

    // 🔗 UPDATE REQUISITION
    requisition.status = "GRN_CREATED";
    requisition.grn = grn._id;
    await requisition.save();

    const updatedReq = await Requisition.findById(requisition._id).populate("grn");

    res.status(201).json({
      grn,
      requisition: updatedReq,
    });
  } catch (err) {
    console.error("Create GRN Error ❌", err);
    res.status(500).json({
      message: "Failed to create GRN",
      error: err.message,
    });
  }
};
