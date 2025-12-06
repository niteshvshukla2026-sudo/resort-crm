import express from "express";
import Resort from "../models/Resort.js";

const router = express.Router();

// GENERATE CODE
function generateCode(name = "") {
  if (!name) return "R" + Math.floor(Math.random() * 999);
  const clean = name.trim().split(/\s+/).map(w => w[0]).join("").slice(0,4).toUpperCase();
  return clean || "R" + Math.floor(Math.random() * 999);
}

// GET ALL RESORTS
router.get("/resorts", async (req, res) => {
  try {
    const resorts = await Resort.find().sort({ createdAt: -1 });
    return res.json({ ok: true, resorts });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message });
  }
});

// CREATE RESORT
router.post("/resorts", async (req, res) => {
  try {
    const data = req.body;
    if (!data.code) data.code = generateCode(data.name);

    const created = await Resort.create(data);
    return res.json({ ok: true, resort: created });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message });
  }
});

// UPDATE RESORT
router.put("/resorts/:id", async (req, res) => {
  try {
    const updated = await Resort.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    return res.json({ ok: true, resort: updated });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message });
  }
});

// DELETE RESORT
router.delete("/resorts/:id", async (req, res) => {
  try {
    await Resort.findByIdAndDelete(req.params.id);
    return res.json({ ok: true, message: "Resort deleted" });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message });
  }
});

export default router;
