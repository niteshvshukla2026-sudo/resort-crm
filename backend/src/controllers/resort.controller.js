const mongoose = require("mongoose");

exports.listResorts = async (req, res) => {
  try {
    const Resort = mongoose.models.Resort;
    const data = await Resort.find().lean();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Failed to load resorts" });
  }
};

exports.createResort = async (req, res) => {
  try {
    const Resort = mongoose.models.Resort;
    const doc = await Resort.create(req.body);
    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ message: "Failed to create resort" });
  }
};

exports.updateResort = async (req, res) => {
  try {
    const Resort = mongoose.models.Resort;
    const doc = await Resort.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: "Failed to update resort" });
  }
};

exports.deleteResort = async (req, res) => {
  try {
    const Resort = mongoose.models.Resort;
    await Resort.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete resort" });
  }
};
