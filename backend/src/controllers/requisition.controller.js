const Requisition = require("../models/requisition.model");
const Store = require("../models/store.model");

function generateRequisitionNo() {
  return `REQ-${Date.now()}`;
}

exports.getAll = async (req, res) => {
  const list = await Requisition.find()
    .populate("vendor")
    .populate("fromStore")
    .populate("toStore")
    .populate("store")
    .populate("resort")
    .populate("department")
    .populate("lines.item")
    .populate("po")
    .populate("grn")
    .sort({ createdAt: -1 });

  res.json(list);
};

exports.getOne = async (req, res) => {
  const rec = await Requisition.findById(req.params.id)
    .populate("vendor")
    .populate("fromStore")
    .populate("toStore")
    .populate("store")
    .populate("resort")
    .populate("department")
    .populate("lines.item");

  res.json(rec);
};

exports.create = async (req, res) => {
  const body = req.body;

  const newReq = new Requisition({
    ...body,
    requisitionNo: generateRequisitionNo(),
  });

  await newReq.save();

  const full = await Requisition.findById(newReq._id)
    .populate("vendor")
    .populate("fromStore")
    .populate("toStore")
    .populate("store")
    .populate("resort")
    .populate("department")
    .populate("lines.item");

  res.json(full);
};

exports.update = async (req, res) => {
  await Requisition.findByIdAndUpdate(req.params.id, req.body);
  const full = await Requisition.findById(req.params.id)
    .populate("vendor")
    .populate("fromStore")
    .populate("toStore")
    .populate("store")
    .populate("resort")
    .populate("department")
    .populate("lines.item");

  res.json(full);
};

exports.delete = async (req, res) => {
  await Requisition.findByIdAndDelete(req.params.id);
  res.json({ success: true });
};

exports.approve = async (req, res) => {
  await Requisition.findByIdAndUpdate(req.params.id, { status: "APPROVED" });
  const updated = await Requisition.findById(req.params.id);
  res.json(updated);
};

exports.hold = async (req, res) => {
  await Requisition.findByIdAndUpdate(req.params.id, { status: "ON_HOLD" });
  const updated = await Requisition.findById(req.params.id);
  res.json(updated);
};

exports.reject = async (req, res) => {
  await Requisition.findByIdAndUpdate(req.params.id, {
    status: "REJECTED",
    rejectionReason: req.body.reason || "",
  });
  const updated = await Requisition.findById(req.params.id);
  res.json(updated);
};
