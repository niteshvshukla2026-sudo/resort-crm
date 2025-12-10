// backend/src/routes/itemCategories.routes.js
import express from "express";
import ItemCategory from "../models/itemCategory.model.js";

const router = express.Router();

// simple helper: if code diya hai to use karo, warna auto bana do
function makeCode(name = "", code = "") {
  if (code && code.trim()) return code.trim();

  const base =
    (name || "")
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => (w.length <= 4 ? w : w.slice(0, 4)))
      .join("_") || "IC";

  const suffix = Math.floor(Math.random() * 900 + 100); // 100..999
  return `${base}_${suffix}`.slice(0, 20);
}

// GET all
router.get("/", async (req, res, next) => {
  try {
    const list = await ItemCategory.find()
      .populate("department", "name code resort")
      .sort({ name: 1 });

    res.json(list); // plain array
  } catch (err) {
    next(err);
  }
});

// CREATE
router.post("/", async (req, res, next) => {
  try {
    const { name, code, department, departmentCategory } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Item category name required" });
    }

    const departmentId = department || departmentCategory;
    if (!departmentId) {
      return res.status(400).json({ message: "Department is required" });
    }

    const finalCode = makeCode(name, code);

    const created = await ItemCategory.create({
      name: name.trim(),
      code: finalCode,
      department: departmentId,
    });

    const populated = await created.populate("department", "name code resort");
    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
});

// UPDATE
router.put("/:id", async (req, res, next) => {
  try {
    const { name, code, department, departmentCategory, isActive } = req.body;

    const ic = await ItemCategory.findById(req.params.id);
    if (!ic) {
      return res.status(404).json({ message: "Item category not found" });
    }

    if (name && name.trim()) ic.name = name.trim();
    if (code || name) ic.code = makeCode(name || ic.name, code);

    const departmentId = department || departmentCategory;
    if (departmentId) ic.department = departmentId;

    if (typeof isActive === "boolean") ic.isActive = isActive;

    await ic.save();
    const populated = await ic.populate("department", "name code resort");
    res.json(populated);
  } catch (err) {
    next(err);
  }
});

// DELETE
router.delete("/:id", async (req, res, next) => {
  try {
    const ic = await ItemCategory.findByIdAndDelete(req.params.id);
    if (!ic) {
      return res.status(404).json({ message: "Item category not found" });
    }
    res.json({ ok: true, message: "Item category deleted" });
  } catch (err) {
    next(err);
  }
});

export default router;
