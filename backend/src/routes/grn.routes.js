module.exports = (router, mongoose) => {
  const GRN = mongoose.models.GRN;

  router.get("/api/grn", async (_, res) => {
    res.json(await GRN.find().lean());
  });

  router.post("/api/grn", async (req, res) => {
    res.status(201).json(await GRN.create(req.body));
  });

  router.delete("/api/grn/:id", async (req, res) => {
    await GRN.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  });
};