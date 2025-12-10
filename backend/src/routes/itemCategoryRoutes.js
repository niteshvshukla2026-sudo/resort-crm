const express = require("express");
const router = express.Router();
const ItemCategory = require("../models/itemCategoryModel");
const Department = require("../models/departmentModel"); // tumhara department model ka path
const { generateCodeFromName } = require("../utils/codeGenerator");

/**
 * FRONTEND expectation:
 * GET /api/item-categories  -> plain array []
 * Each item with populated department object.
 */

// GET all item categories (optionally by resort)
router.get("/", async (req, res) => {
  try {
    const { resort } = req.query;
    const filter = {};

    if (resort) filter.resort = resort;

    const list = await ItemCategory.find(filter)
      .populate("department", "name code resort")
      .sort({ name: 1 });

    res.json(list); // array
  } catch (err) {
    console.error("GET /api/item-categories error:", err);
    res.status(500).json({ message: "Failed to fetch item categories" });
  }
});

// CREATE new item category
router.post("/", async (req, res) => {
  try {
    const { name, code, department, departmentCategory } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Item category name required" });
    }

    // frontend kabhi "department", kabhi "departmentCategory" bhej sakta hai (humne dono bheje)
    const departmentId = department || departmentCategory;
    if (!departmentId) {
      return res.status(400).json({ message: "Department is required" });
    }

    const deptDoc = await Department.findById(departmentId);
    if (!deptDoc) {
      return res.status(400).json({ message: "Invalid department" });
    }

    const finalCode =
      code && code.trim().length
        ? code.trim()
        : generateCodeFromName(name, "IC");

    const created = await ItemCategory.create({
      name: name.trim(),
      code: finalCode,
      department: deptDoc._id,
      resort: deptDoc.resort, // same resort as department
    });

    const populated = await created.populate("department", "name code resort");

    res.status(201).json(populated); // single object (frontend map karega)
  } catch (err) {
    console.error("POST /api/item-categories error:", err);
    res.status(500).json({ message: "Failed to create item category" });
  }
});

// UPDATE item category
router.put("/:id", async (req, res) => {
  try {
    const { name, code, department, departmentCategory, isActive } = req.body;
    const departmentId = department || departmentCategory;

    const ic = await ItemCategory.findById(req.params.id);
    if (!ic) {
      return res.status(404).json({ message: "Item category not found" });
    }

    if (name && name.trim()) ic.name = name.trim();
    if (code && code.trim()) ic.code = code.trim();

    if (typeof isActive === "boolean") {
      ic.isActive = isActive;
    }

    if (departmentId) {
      const deptDoc = await Department.findById(departmentId);
      if (!deptDoc) {
        return res.status(400).json({ message: "Invalid department" });
      }
      ic.department = deptDoc._id;
      ic.resort = deptDoc.resort;
    }

    await ic.save();
    const populated = await ic.populate("department", "name code resort");

    res.json(populated);
  } catch (err) {
    console.error("PUT /api/item-categories/:id error:", err);
    res.status(500).json({ message: "Failed to update item category" });
  }
});

// DELETE item category
router.delete("/:id", async (req, res) => {
  try {
    const ic = await ItemCategory.findByIdAndDelete(req.params.id);
    if (!ic) {
      return res.status(404).json({ message: "Item category not found" });
    }
    res.json({ ok: true, message: "Item category deleted" });
  } catch (err) {
    console.error("DELETE /api/item-categories/:id error:", err);
    res.status(500).json({ message: "Failed to delete item category" });
  }
});

module.exports = router;
