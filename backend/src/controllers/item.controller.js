const mongoose = require("mongoose");
const Item = mongoose.models.Item;

exports.list = async (_, res) => {
  res.json(await Item.find().lean());
};

exports.create = async (req, res) => {
  const doc = await Item.create(req.body);
  res.status(201).json(doc);
};

exports.update = async (req, res) => {
  const doc = await Item.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(doc);
};

exports.remove = async (req, res) => {
  await Item.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
};