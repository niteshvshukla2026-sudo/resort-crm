const mongoose = require("mongoose");
const Requisition = mongoose.models.Requisition;

const generateReqNo = () => {
  const d = new Date();
  return `REQ-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}-${Math.floor(100+Math.random()*900)}`;
};

exports.list = async (req, res) => {
  const filter = {};
  if (req.query.resort && req.query.resort !== "ALL") filter.resort = req.query.resort;
  res.json(await Requisition.find(filter).lean());
};

exports.getOne = async (req, res) => {
  const doc = await Requisition.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: "Not found" });
  res.json(doc);
};

exports.create = async (req, res) => {
  const doc = await Requisition.create({
    ...req.body,
    requisitionNo: generateReqNo(),
    status: "PENDING",
    createdBy: "SYSTEM",
  });
  res.status(201).json(doc);
};

exports.update = async (req, res) => {
  const doc = await Requisition.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(doc);
};

exports.remove = async (req, res) => {
  await Requisition.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
};

exports.approve = async (req, res) => {
  const doc = await Requisition.findByIdAndUpdate(
    req.params.id,
    { status: "APPROVED", approvedAt: new Date(), approvedBy: req.user?.id || "SYSTEM" },
    { new: true }
  );
  res.json(doc);
};

exports.hold = async (req, res) => {
  res.json(await Requisition.findByIdAndUpdate(req.params.id, { status: "ON_HOLD" }, { new: true }));
};

exports.reject = async (req, res) => {
  res.json(
    await Requisition.findByIdAndUpdate(
      req.params.id,
      { status: "REJECTED", rejectionReason: req.body.reason || "" },
      { new: true }
    )
  );
};