const Role = require("../models/role.model");

// ================= LIST ROLES =================
async function listRoles(req, res) {
  try {
    const roles = await Role.find().sort({ createdAt: 1 });
    res.json(roles);
  } catch (err) {
    console.error("listRoles error:", err);
    res.status(500).json({ message: "Failed to load roles" });
  }
}

// ================= CREATE ROLE =================
async function createRole(req, res) {
  try {
    const {
      name,
      key,
      description,
      type,
      storeMode,
      permissions,
    } = req.body;

    if (!name || !key) {
      return res
        .status(400)
        .json({ message: "Role name and key are required" });
    }

    const exists = await Role.findOne({ key });
    if (exists) {
      return res.status(400).json({ message: "Role key already exists" });
    }

    const role = await Role.create({
      name,
      key,
      description,
      type: type || "CUSTOM",
      storeMode: storeMode || "MULTI",
      permissions: permissions || [],
    });

    res.status(201).json(role);
  } catch (err) {
    console.error("createRole error:", err);
    res.status(500).json({ message: "Failed to create role" });
  }
}

// ================= UPDATE ROLE =================
async function updateRole(req, res) {
  try {
    const id = req.params.id;

    const role = await Role.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    res.json(role);
  } catch (err) {
    console.error("updateRole error:", err);
    res.status(500).json({ message: "Failed to update role" });
  }
}

// ================= DELETE ROLE =================
async function deleteRole(req, res) {
  try {
    const id = req.params.id;

    const role = await Role.findByIdAndDelete(id);
    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("deleteRole error:", err);
    res.status(500).json({ message: "Failed to delete role" });
  }
}

module.exports = {
  listRoles,
  createRole,
  updateRole,
  deleteRole,
};
