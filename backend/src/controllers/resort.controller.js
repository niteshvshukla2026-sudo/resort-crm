// backend/src/controllers/resort.controller.js
// ✅ PURE CJS | PRODUCTION SAFE

const Resort = require("../models/resort.model");

/**
 * GET /api/resorts
 * SUPER_ADMIN → all resorts
 */
exports.listResorts = async (req, res) => {
  try {
    const resorts = await Resort.find()
      .sort({ createdAt: -1 })
      .lean();

    return res.json(resorts);
  } catch (err) {
    console.error("LIST RESORTS ERROR ❌", err);
    return res.status(500).json({
      message: "Failed to load resorts",
    });
  }
};

/**
 * POST /api/resorts
 */
exports.createResort = async (req, res) => {
  try {
    const doc = await Resort.create(req.body);
    return res.status(201).json(doc);
  } catch (err) {
    console.error("CREATE RESORT ERROR ❌", err);
    return res.status(500).json({
      message: "Failed to create resort",
    });
  }
};

/**
 * PUT /api/resorts/:id
 */
exports.updateResort = async (req, res) => {
  try {
    const updated = await Resort.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        message: "Resort not found",
      });
    }

    return res.json(updated);
  } catch (err) {
    console.error("UPDATE RESORT ERROR ❌", err);
    return res.status(500).json({
      message: "Failed to update resort",
    });
  }
};

/**
 * DELETE /api/resorts/:id
 */
exports.deleteResort = async (req, res) => {
  try {
    const deleted = await Resort.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        message: "Resort not found",
      });
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error("DELETE RESORT ERROR ❌", err);
    return res.status(500).json({
      message: "Failed to delete resort",
    });
  }
};
