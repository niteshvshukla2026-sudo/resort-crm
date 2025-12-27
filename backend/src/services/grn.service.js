const mongoose = require("mongoose");
const GRN = mongoose.models.GRN;
const PO = mongoose.models.PO;
const Requisition = mongoose.models.Requisition;
const { addStock } = require("./stock.service");

exports.closeGRN = async (grnId) => {
  const grn = await GRN.findById(grnId);
  if (!grn) throw new Error("GRN not found");

  for (const line of grn.items || []) {
    await addStock(grn.store, line.item, Number(line.receivedQty || 0), grn.resort);
  }

  grn.status = "CLOSED";
  await grn.save();

  if (grn.poId) {
    await PO.findByIdAndUpdate(grn.poId, { status: "CLOSED" });
  }

  if (grn.requisitionId) {
    await Requisition.findByIdAndUpdate(grn.requisitionId, { status: "GRN_CREATED" });
  }

  return grn;
};