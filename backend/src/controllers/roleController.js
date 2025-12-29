// backend/src/controllers/roleController.js
import Role from "../models/Role.js";
import { MODULES, ACTIONS } from "../config/permissions.js";

export const getMetadata = (req, res) => {
  res.json({ modules: MODULES, actions: ACTIONS });
};

export const getRoles = async (req, res) => {
  try {
    const roles = await Role.find().sort({ type: 1, name: 1 });
    res.json(roles);
  } catch (err) {
    console.error("getRoles error", err);
    res.status(500).json({ message: "Failed to fetch roles" });
  }
};

export const createRole = async (req, res) => {
  try {
    const { name, key, description, permissions, type } = req.body;

    if (!name || !key) {
      return res
        .status(400)
        .json({ message: "Name and key are required for role" });
    }

    const existing = await Role.findOne({ key });
    if (existing) {
      return res
        .status(400)
        .json({ message: `Role with key ${key} already exists` });
    }

    const role = await Role.create({
      name,
      key,
      description,
      type: type || "CUSTOM",
      permissions: permissions || [],
    });

    res.status(201).json(role);
  } catch (err) {
    console.error("createRole error", err);
    res.status(500).json({ message: "Failed to create role" });
  }
};

export const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, permissions } = req.body;

    const role = await Role.findById(id);
    if (!role) return res.status(404).json({ message: "Role not found" });

    if (name) role.name = name;
    if (description !== undefined) role.description = description;
    if (permissions !== undefined) role.permissions = permissions;

    await role.save();
    res.json(role);
  } catch (err) {
    console.error("updateRole error", err);
    res.status(500).json({ message: "Failed to update role" });
  }
};

export const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;

    const role = await Role.findById(id);
    if (!role) return res.status(404).json({ message: "Role not found" });

    if (role.type === "SYSTEM") {
      return res
        .status(400)
        .json({ message: "System roles cannot be deleted" });
    }

    await role.deleteOne();
    res.json({ message: "Role deleted" });
  } catch (err) {
    console.error("deleteRole error", err);
    res.status(500).json({ message: "Failed to delete role" });
  }
};
