const mongoose = require("mongoose");

exports.listDepartments = async (req, res) => {
  try {
    const Department = mongoose.models.Department;
    const data = await Department.find().lean();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Failed to load departments" });
  }
};

exports.createDepartment = async (req, res) => {
  try {
    const Department = mongoose.models.Department;
    const doc = await Department.create(req.body);
    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ message: "Failed to create department" });
  }
};

exports.updateDepartment = async (req, res) => {
  try {
    const Department = mongoose.models.Department;
    const doc = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: "Failed to update department" });
  }
};

exports.deleteDepartment = async (req, res) => {
  try {
    const Department = mongoose.models.Department;
    await Department.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete department" });
  }
};
