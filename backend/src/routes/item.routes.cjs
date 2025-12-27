module.exports = (router, mongoose) => {
  const Item = mongoose.models.Item;

  router.get("/api/items", async (req, res) => {
    res.json(await Item.find().lean());
  });

  router.post("/api/items", async (req, res) => {
    res.status(201).json(await Item.create(req.body));
  });

  router.put("/api/items/:id", async (req, res) => {
    res.json(
      await Item.findByIdAndUpdate(req.params.id, req.body, { new: true })
    );
  });

  router.delete("/api/items/:id", async (req, res) => {
    await Item.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  });
};
