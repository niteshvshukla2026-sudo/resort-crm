const mongoose = require("mongoose");
const Role = mongoose.models.Role;

exports.list = async (_, res) => {
  res.json(await Role.find().lean());
};

exports.create = async (req, res) => {
  const role = await Role.create(req.body);
  res.status(201).json(role);
};

exports.update = async (req, res) => {
  const role = await Role.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(role);
};