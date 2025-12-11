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
