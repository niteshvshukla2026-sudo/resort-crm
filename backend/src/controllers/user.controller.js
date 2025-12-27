const mongoose = require("mongoose");
const User = mongoose.models.User;

exports.list = async (_, res) => {
  res.json(await User.find().lean());
};

exports.create = async (req, res) => {
  const user = await User.create(req.body);
  res.status(201).json(user);
};

exports.update = async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(user);
};