const Department = require("../models/department.model");

/**
 * GET /api/departments
 */
exports.listDepartments = async (req, res) => {
  try {
    const departments = await Department.find()
      .sort({ createdAt: -1 })
      .lean();

    res.json(departments);
  } catch (err) {
    console.error("LIST DEPARTMENTS ERROR ❌", err);
    res.status(500).json({
      message: "Failed to load departments",
    });
  }
};

/**
 * POST /api/departments
 */
exports.createDepartment = async (req, res) => {
  try {
    const { name, code } = req.body;

    if (!name || !code) {
      return res.status(400).json({
        message: "Name and code are required",
      });
    }

    const doc = await Department.create({
      name: name.trim(),
      code: code.trim().toUpperCase(),
    });

    res.status(201).json(doc);
  } catch (err) {
    console.error("CREATE DEPARTMENT ERROR ❌", err);
    res.status(500).json({
      message: "Failed to create department",
    });
  }
};

/**
 * PUT /api/departments/:id
 */
exports.updateDepartment = async (req, res) => {
  try {
    const updated = await Department.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        message: "Department not found",
      });
    }

    res.json(updated);
  } catch (err) {
    console.error("UPDATE DEPARTMENT ERROR ❌", err);
    res.status(500).json({
      message: "Failed to update department",
    });
  }
};

/**
 * DELETE /api/departments/:id
 */
exports.deleteDepartment = async (req, res) => {
  try {
    const deleted = await Department.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        message: "Department not found",
      });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("DELETE DEPARTMENT ERROR ❌", err);
    res.status(500).json({
      message: "Failed to delete department",
    });
  }
};
