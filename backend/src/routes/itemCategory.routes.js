module.exports = (router, mongoose) => {
  const ItemCategory = mongoose.models.ItemCategory;

  router.get("/api/item-categories", async (_, res) => {
    res.json(await ItemCategory.find().lean());
  });

  router.post("/api/item-categories", async (req, res) => {
    res.status(201).json(await ItemCategory.create(req.body));
  });

  router.put("/api/item-categories/:id", async (req, res) => {
    res.json(
      await ItemCategory.findByIdAndUpdate(req.params.id, req.body, { new: true })
    );
  });

  router.delete("/api/item-categories/:id", async (req, res) => {
    await ItemCategory.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  });
};