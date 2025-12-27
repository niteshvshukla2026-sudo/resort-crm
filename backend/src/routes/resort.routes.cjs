module.exports = (router, mongoose) => {
  const Resort = mongoose.models.Resort;

  // =========================
  // GET ALL RESORTS
  // =========================
  router.get("/api/resorts", async (req, res) => {
    try {
      const resorts = await Resort.find().sort({ name: 1 }).lean();
      res.json(resorts);
    } catch (err) {
      console.error("GET /resorts error", err);
      res.status(500).json({ message: "Failed to load resorts" });
    }
  });

  // =========================
  // CREATE RESORT
  // =========================
  router.post("/api/resorts", async (req, res) => {
    try {
      const { name, code } = req.body;
      if (!name) {
        return res.status(400).json({ message: "Resort name is required" });
      }

      const resort = await Resort.create({
        name,
        code,
      });

      res.status(201).json(resort);
    } catch (err) {
      console.error("POST /resorts error", err);
      res.status(500).json({ message: "Failed to create resort" });
    }
  });

  // =========================
  // UPDATE RESORT
  // =========================
  router.put("/api/resorts/:id", async (req, res) => {
    try {
      const resort = await Resort.findById(req.params.id);
      if (!resort) return res.status(404).json({ message: "Resort not found" });

      resort.name = req.body.name ?? resort.name;
      resort.code = req.body.code ?? resort.code;

      await resort.save();
      res.json(resort);
    } catch (err) {
      console.error("PUT /resorts error", err);
      res.status(500).json({ message: "Failed to update resort" });
    }
  });

  // =========================
  // DELETE RESORT
  // =========================
  router.delete("/api/resorts/:id", async (req, res) => {
    try {
      await Resort.findByIdAndDelete(req.params.id);
      res.json({ ok: true });
    } catch (err) {
      console.error("DELETE /resorts error", err);
      res.status(500).json({ message: "Failed to delete resort" });
    }
  });
};
