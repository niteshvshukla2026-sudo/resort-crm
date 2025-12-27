module.exports = (router, mongoose) => {
  const Store = mongoose.models.Store;

  router.get("/api/stores", async (req, res) => {
    const { resort } = req.query;
    const filter = resort && resort !== "ALL" ? { resort } : {};
    const data = await Store.find(filter).lean();
    res.json(data);
  });

  router.post("/api/stores", async (req, res) => {
    const doc = await Store.create(req.body);
    res.status(201).json(doc);
  });

  router.put("/api/stores/:id", async (req, res) => {
    const doc = await Store.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(doc);
  });

  router.delete("/api/stores/:id", async (req, res) => {
    await Store.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  });
};
