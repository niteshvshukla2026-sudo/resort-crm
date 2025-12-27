module.exports = (router, mongoose) => {
  const Store = mongoose.models.Store;

  router.get("/api/stores", async (req, res) => {
    const filter = {};
    if (req.query.resort && req.query.resort !== "ALL") {
      filter.resort = req.query.resort;
    }
    res.json(await Store.find(filter).lean());
  });

  router.post("/api/stores", async (req, res) => {
    const { resort, name } = req.body;
    const last = await Store.findOne({ resort }).sort({ createdAt: -1 });
    const next = last?.code ? parseInt(last.code.split("-")[1]) + 1 : 1;

    const doc = await Store.create({
      resort,
      name,
      code: `STR-${String(next).padStart(3, "0")}`,
    });
    res.status(201).json(doc);
  });

  router.put("/api/stores/:id", async (req, res) => {
    const doc = await Store.findByIdAndUpdate(
      req.params.id,
      { name: req.body.name },
      { new: true }
    );
    res.json(doc);
  });

  router.delete("/api/stores/:id", async (req, res) => {
    await Store.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  });
};