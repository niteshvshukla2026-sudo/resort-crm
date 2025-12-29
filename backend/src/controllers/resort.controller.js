const mongoose = require("mongoose");

exports.listResorts = async (req, res) => {
  try {
    const Resort = mongoose.models.Resort;

    const resorts = await Resort.find().sort({ createdAt: -1 }).lean();

    res.json(resorts);
  } catch (err) {
    console.error("LIST RESORTS ERROR", err);
    res.status(500).json({ message: "Failed to load resorts" });
  }
};

exports.createResort = async (req, res) => {
  try {
    const Resort = mongoose.models.Resort;

    const doc = await Resort.create(req.body);
    res.status(201).json(doc);
  } catch (err) {
    console.error("CREATE RESORT ERROR", err);
    res.status(500).json({ message: "Failed to create resort" });
  }
};

exports.updateResort = async (req, res) => {
  try {
    const Resort = mongoose.models.Resort;

    const updated = await Resort.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Resort not found" });
    }

    res.json(updated);
  } catch (err) {
    console.error("UPDATE RESORT ERROR", err);
    res.status(500).json({ message: "Failed to update resort" });
  }
};

exports.deleteResort = async (req, res) => {
  try {
    const Resort = mongoose.models.Resort;

    const deleted = await Resort.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Resort not found" });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("DELETE RESORT ERROR", err);
    res.status(500).json({ message: "Failed to delete resort" });
  }
};
