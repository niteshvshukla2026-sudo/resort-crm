const mongoose = require("mongoose");

exports.listDepartments = async (req, res) => {
  try {
    const Department = mongoose.models.Department;

    const departments = await Department.find()
      .sort({ createdAt: -1 })
      .lean();

    // frontend handles both array or {departments}
    res.json(departments);
  } catch (err) {
    console.error("LIST DEPARTMENTS ERROR", err);
    res.status(500).json({ message: "Failed to load departments" });
  }
};

exports.createDepartment = async (req, res) => {
  try {
    const Department = mongoose.models.Department;

    const doc = await Department.create(req.body);
    res.status(201).json(doc);
  } catch (err) {
    console.error("CREATE DEPARTMENT ERROR", err);
    res.status(500).json({ message: "Failed to create department" });
  }
};

exports.updateDepartment = async (req, res) => {
  try {
    const Department = mongoose.models.Department;

    const updated = await Department.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Department not found" });
    }

    res.json(updated);
  } catch (err) {
    console.error("UPDATE DEPARTMENT ERROR", err);
    res.status(500).json({ message: "Failed to update department" });
  }
};

exports.deleteDepartment = async (req, res) => {
  try {
    const Department = mongoose.models.Department;

    const deleted = await Department.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Department not found" });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("DELETE DEPARTMENT ERROR", err);
    res.status(500).json({ message: "Failed to delete department" });
  }
};
