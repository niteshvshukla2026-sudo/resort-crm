module.exports = function createResortController(mongoose) {
  const Resort = require("../models/resort.model.cjs")(mongoose);

  // ================= GET ALL =================
  const listResorts = async (req, res) => {
    try {
      const resorts = await Resort.find().sort({ createdAt: -1 });
      res.json({ ok: true, resorts });
    } catch (err) {
      console.error("listResorts error:", err);
      res.status(500).json({ message: "Failed to load resorts" });
    }
  };

  // ================= CREATE =================
  const createResort = async (req, res) => {
    try {
      const exists = await Resort.findOne({ code: req.body.code });
      if (exists) {
        return res.status(400).json({
          message: "Resort code already exists",
        });
      }

      const resort = await Resort.create(req.body);
      res.json({ ok: true, resort });
    } catch (err) {
      console.error("createResort error:", err);
      res.status(500).json({ message: "Failed to create resort" });
    }
  };

  // ================= UPDATE =================
  const updateResort = async (req, res) => {
    try {
      const { id } = req.params;

      const resort = await Resort.findByIdAndUpdate(id, req.body, {
        new: true,
      });

      if (!resort) {
        return res.status(404).json({ message: "Resort not found" });
      }

      res.json({ ok: true, resort });
    } catch (err) {
      console.error("updateResort error:", err);
      res.status(500).json({ message: "Failed to update resort" });
    }
  };

  // ================= DELETE =================
  const deleteResort = async (req, res) => {
    try {
      const { id } = req.params;

      const resort = await Resort.findByIdAndDelete(id);
      if (!resort) {
        return res.status(404).json({ message: "Resort not found" });
      }

      res.json({ ok: true });
    } catch (err) {
      console.error("deleteResort error:", err);
      res.status(500).json({ message: "Failed to delete resort" });
    }
  };

  return {
    listResorts,
    createResort,
    updateResort,
    deleteResort,
  };
};
