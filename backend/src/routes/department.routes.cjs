module.exports = (router, mongoose) => {
  const Department = mongoose.models.Department;

  router.get("/api/departments", async (req, res) => {
    const data = await Department.find().sort({ name: 1 }).lean();
    res.json(data);
  });

  router.post("/api/departments", async (req, res) => {
    const { name, code } = req.body;
    const doc = await Department.create({ name, code });
    res.status(201).json(doc);
  });

  router.put("/api/departments/:id", async (req, res) => {
    const doc = await Department.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(doc);
  });

  router.delete("/api/departments/:id", async (req, res) => {
    await Department.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  });
};
