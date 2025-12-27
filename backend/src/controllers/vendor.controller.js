const mongoose = require("mongoose");
const Vendor = mongoose.models.Vendor;

exports.list = async (_, res) => {
  res.json(await Vendor.find().lean());
};

exports.create = async (req, res) => {
  const doc = await Vendor.create(req.body);
  res.status(201).json(doc);
};

exports.update = async (req, res) => {
  const doc = await Vendor.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(doc);
};

exports.remove = async (req, res) => {
  await Vendor.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
};