const mongoose = require("mongoose");
const GRN = mongoose.models.GRN;
const PO = mongoose.models.PO;
const Requisition = mongoose.models.Requisition;
const StoreStock = mongoose.models.StoreStock;

const makeGrnNo = () => {
  const d = new Date();
  return `GRN-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}-${Math.floor(100+Math.random()*900)}`;
};

exports.list = async (_, res) => {
  res.json(await GRN.find().lean());
};

exports.createFromRequisition = async (req, res) => {
  const reqDoc = await Requisition.findById(req.params.id);
  if (!reqDoc) return res.status(404).json({ message: "Requisition not found" });

  const grn = await GRN.create({
    grnNo: makeGrnNo(),
    requisitionId: reqDoc._id,
    vendor: reqDoc.vendor,
    resort: reqDoc.resort,
    store: req.body.store || reqDoc.store,
    items: req.body.items || [],
  });

  await Requisition.findByIdAndUpdate(reqDoc._id, { status: "GRN_CREATED" });
  res.status(201).json(grn);
};

exports.createFromPO = async (req, res) => {
  const po = await PO.findById(req.params.id).lean();
  if (!po) return res.status(404).json({ message: "PO not found" });

  const grn = await GRN.create({
    grnNo: makeGrnNo(),
    poId: po._id,
    requisitionId: po.requisitionId,
    vendor: po.vendor,
    resort: po.resort,
    store: po.deliverTo,
    items: po.items.map(i => ({ item: i.item, receivedQty: i.qty })),
  });

  await PO.findByIdAndUpdate(po._id, { status: "CLOSED" });
  if (po.requisitionId) {
    await Requisition.findByIdAndUpdate(po.requisitionId, { status: "GRN_CREATED" });
  }

  res.status(201).json(grn);
};

exports.close = async (req, res) => {
  const grn = await GRN.findById(req.params.id);
  if (!grn) return res.status(404).json({ message: "GRN not found" });

  for (const l of grn.items) {
    await StoreStock.findOneAndUpdate(
      { store: grn.store, item: l.item },
      { $inc: { qty: Number(l.receivedQty || 0) } },
      { upsert: true }
    );
  }

  grn.status = "CLOSED";
  await grn.save();
  res.json(grn);
};