import Department from "../models/department.model.js";

/**
 * GET /api/departments
 * query: name, code, resort
 */
export const listDepartments = async (req, res) => {
  try {
    const { name, code, resort } = req.query;

    const filter = {};

    // 🔥 RESORT FILTER (MOST IMPORTANT)
    if (resort && resort !== "ALL") {
      filter.resort = resort;
    }

    if (name) filter.name = { $regex: name, $options: "i" };
    if (code) filter.code = { $regex: code, $options: "i" };

    const depts = await Department.find(filter)
      .populate("resort", "name")
      .sort({ createdAt: -1 })
      .lean();

    res.json(depts);
  } catch (err) {
    console.error("listDepartments error", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getDepartment = async (req, res) => {
  try {
    const d = await Department.findById(req.params.id)
      .populate("resort", "name")
      .lean();

    if (!d) return res.status(404).json({ message: "Department not found" });
    res.json(d);
  } catch (err) {
    console.error("getDepartment error", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const createDepartment = async (req, res) => {
  try {
    const { name, code, resort } = req.body;

    if (!name || !name.trim())
      return res.status(400).json({ message: "Name is required" });

    if (!code || !code.trim())
      return res.status(400).json({ message: "Code is required" });

    if (!resort)
      return res.status(400).json({ message: "Resort is required" });

    const payload = {
      name: name.trim(),
      code: code.trim().toUpperCase(),
      resort,
    };

    // 🔐 UNIQUE CODE PER RESORT
    const exists = await Department.findOne({
      code: payload.code,
      resort: payload.resort,
    });

    if (exists)
      return res
        .status(409)
        .json({ message: "Department code already exists for this resort" });

    const created = await Department.create(payload);
    res.status(201).json(created);
  } catch (err) {
    console.error("createDepartment error", err);
    res.status(500).json({ message: "Failed to create department" });
  }
};

export const updateDepartment = async (req, res) => {
  try {
    const payload = {};

    if (req.body.name) payload.name = req.body.name.trim();
    if (req.body.code) payload.code = req.body.code.trim().toUpperCase();

    if (payload.code) {
      const current = await Department.findById(req.params.id);
      if (!current)
        return res.status(404).json({ message: "Department not found" });

      const exists = await Department.findOne({
        code: payload.code,
        resort: current.resort,
        _id: { $ne: req.params.id },
      });

      if (exists)
        return res
          .status(409)
          .json({ message: "Department code already in use for this resort" });
    }

    const updated = await Department.findByIdAndUpdate(
      req.params.id,
      payload,
      { new: true, runValidators: true }
    ).lean();

    if (!updated)
      return res.status(404).json({ message: "Department not found" });

    res.json(updated);
  } catch (err) {
    console.error("updateDepartment error", err);
    res.status(500).json({ message: "Failed to update" });
  }
};

export const deleteDepartment = async (req, res) => {
  try {
    const removed = await Department.findByIdAndDelete(req.params.id);
    if (!removed)
      return res.status(404).json({ message: "Department not found" });

    res.json({ success: true });
  } catch (err) {
    console.error("deleteDepartment error", err);
    res.status(500).json({ message: "Failed to delete" });
  }
};
