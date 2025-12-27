// backend/src/controllers/department.controller.js
import Department from "../models/department.model.js";

/**
 * GET /api/departments
 * optional query: name, code
 */
export const listDepartments = async (req, res) => {
  try {
    const filter = {};
    if (req.query.name) filter.name = { $regex: req.query.name, $options: "i" };
    if (req.query.code) filter.code = { $regex: req.query.code, $options: "i" };
    const depts = await Department.find(filter).sort({ createdAt: -1 }).lean();
    res.json(depts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getDepartment = async (req, res) => {
  try {
    const d = await Department.findById(req.params.id).lean();
    if (!d) return res.status(404).json({ message: "Department not found" });
    res.json(d);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const createDepartment = async (req, res) => {
  try {
    const { name, code } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: "Name is required" });
    if (!code || !code.trim()) return res.status(400).json({ message: "Code is required" });

    // normalize
    const payload = { name: name.trim(), code: code.trim().toUpperCase() };

    // avoid duplicate codes
    const exists = await Department.findOne({ code: payload.code });
    if (exists) return res.status(409).json({ message: "Code already exists" });

    const created = await Department.create(payload);
    res.status(201).json(created);
  } catch (err) {
    console.error("createDepartment error", err);
    res.status(500).json({ message: "Failed to create department" });
  }
};

export const updateDepartment = async (req, res) => {
  try {
    const { name } = req.body;
    // We will regenerate/replace code on update only if frontend sends a code.
    // But per your frontend behavior code is auto-generated; we'll accept payload.code if present
    const payload = {};
    if (name) payload.name = name.trim();
    if (req.body.code) payload.code = req.body.code.trim().toUpperCase();

    if (payload.code) {
      const exists = await Department.findOne({ code: payload.code, _id: { $ne: req.params.id } });
      if (exists) return res.status(409).json({ message: "Code already in use" });
    }

    const updated = await Department.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true }).lean();
    if (!updated) return res.status(404).json({ message: "Department not found" });
    res.json(updated);
  } catch (err) {
    console.error("updateDepartment error", err);
    res.status(500).json({ message: "Failed to update" });
  }
};

export const deleteDepartment = async (req, res) => {
  try {
    const removed = await Department.findByIdAndDelete(req.params.id);
    if (!removed) return res.status(404).json({ message: "Department not found" });
    res.json({ success: true });
  } catch (err) {
    console.error("deleteDepartment error", err);
    res.status(500).json({ message: "Failed to delete" });
  }
};
