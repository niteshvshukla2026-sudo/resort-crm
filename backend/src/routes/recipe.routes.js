module.exports = (router, mongoose) => {
  const Recipe = mongoose.models.Recipe;

  router.get("/api/recipes", async (_, res) => {
    res.json(await Recipe.find().lean());
  });

  router.post("/api/recipes", async (req, res) => {
    res.status(201).json(await Recipe.create(req.body));
  });

  router.put("/api/recipes/:id", async (req, res) => {
    res.json(await Recipe.findByIdAndUpdate(req.params.id, req.body, { new: true }));
  });

  router.delete("/api/recipes/:id", async (req, res) => {
    await Recipe.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  });
};