const mongoose = require("mongoose");
const PO = mongoose.models.PO;
const Requisition = mongoose.models.Requisition;

const makePoNo = () => {
  const d = new Date();
  return `PO-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}-${Math.floor(100+Math.random()*900)}`;
};

exports.list = async (_, res) => {
  res.json(await PO.find().lean());
};

exports.create = async (req, res) => {
  const doc = await PO.create({ ...req.body, poNo: makePoNo(), status: "OPEN" });
  if (req.body.requisitionId) {
    await Requisition.findByIdAndUpdate(req.body.requisitionId, { status: "PO_CREATED" });
  }
  res.status(201).json(doc);
};

exports.createFromRequisition = async (req, res) => {
  const reqDoc = await Requisition.findById(req.params.id).lean();
  if (!reqDoc) return res.status(404).json({ message: "Requisition not found" });
  if (reqDoc.type !== "VENDOR" || reqDoc.status !== "APPROVED") {
    return res.status(400).json({ message: "Invalid requisition" });
  }

  const po = await PO.create({
    poNo: makePoNo(),
    requisitionId: reqDoc._id,
    vendor: reqDoc.vendor,
    resort: reqDoc.resort,
    deliverTo: reqDoc.store || reqDoc.toStore,
    items: reqDoc.lines,
    status: "OPEN",
  });

  await Requisition.findByIdAndUpdate(reqDoc._id, { status: "PO_CREATED" });
  res.status(201).json(po);
};