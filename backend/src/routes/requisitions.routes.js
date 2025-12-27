module.exports = (router, mongoose) => {
  const Requisition = mongoose.models.Requisition;

  router.get("/api/requisitions", async (req, res) => {
    const { resort } = req.query;
    const filter = resort && resort !== "ALL" ? { resort } : {};
    res.json(await Requisition.find(filter).lean());
  });

  router.get("/api/requisitions/:id", async (req, res) => {
    res.json(await Requisition.findById(req.params.id).lean());
  });

  router.post("/api/requisitions", async (req, res) => {
    res.status(201).json(await Requisition.create(req.body));
  });

  router.put("/api/requisitions/:id", async (req, res) => {
    res.json(
      await Requisition.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
      })
    );
  });

  router.delete("/api/requisitions/:id", async (req, res) => {
    await Requisition.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  });
};
