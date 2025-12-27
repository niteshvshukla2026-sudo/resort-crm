module.exports = function createDepartmentController(mongoose) {
  const Department = require("../models/department.model.cjs")(mongoose);

  // ================= GET ALL =================
  const listDepartments = async (req, res) => {
    try {
      const departments = await Department.find().sort({ name: 1 });
      res.json({ ok: true, departments });
    } catch (err) {
      console.error("listDepartments error:", err);
      res.status(500).json({ message: "Failed to load departments" });
    }
  };

  // ================= CREATE =================
  const createDepartment = async (req, res) => {
    try {
      const { name, code } = req.body;

      if (!name || !code) {
        return res.status(400).json({
          message: "Name and code are required",
        });
      }

      const exists = await Department.findOne({ code });
      if (exists) {
        return res.status(400).json({
          message: "Department code already exists",
        });
      }

      const department = await Department.create({
        name: name.trim(),
        code: code.trim(),
      });

      res.json({ ok: true, department });
    } catch (err) {
      console.error("createDepartment error:", err);
      res.status(500).json({ message: "Failed to create department" });
    }
  };

  // ================= UPDATE =================
  const updateDepartment = async (req, res) => {
    try {
      const { id } = req.params;
      const { name, code } = req.body;

      const department = await Department.findByIdAndUpdate(
        id,
        {
          name: name?.trim(),
          code: code?.trim(),
        },
        { new: true }
      );

      if (!department) {
        return res.status(404).json({ message: "Department not found" });
      }

      res.json({ ok: true, department });
    } catch (err) {
      console.error("updateDepartment error:", err);
      res.status(500).json({ message: "Failed to update department" });
    }
  };

  // ================= DELETE =================
  const deleteDepartment = async (req, res) => {
    try {
      const { id } = req.params;

      const department = await Department.findByIdAndDelete(id);
      if (!department) {
        return res.status(404).json({ message: "Department not found" });
      }

      res.json({ ok: true });
    } catch (err) {
      console.error("deleteDepartment error:", err);
      res.status(500).json({ message: "Failed to delete department" });
    }
  };

  return {
    listDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment,
  };
};
