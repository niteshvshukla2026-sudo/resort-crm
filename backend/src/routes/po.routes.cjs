module.exports = (router, mongoose) => {
  const PO = mongoose.models.PO;

  router.get("/api/po", async (req, res) => {
    res.json(await PO.find().lean());
  });

  router.post("/api/po", async (req, res) => {
    res.status(201).json(await PO.create(req.body));
  });

  router.put("/api/po/:id", async (req, res) => {
    res.json(await PO.findByIdAndUpdate(req.params.id, req.body, { new: true }));
  });

  router.delete("/api/po/:id", async (req, res) => {
    await PO.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  });
};
