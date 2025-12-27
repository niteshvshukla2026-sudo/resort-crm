module.exports = (router, mongoose) => {
  const Vendor = mongoose.models.Vendor;

  router.get("/api/vendors", async (req, res) => {
    res.json(await Vendor.find().lean());
  });

  router.post("/api/vendors", async (req, res) => {
    res.status(201).json(await Vendor.create(req.body));
  });

  router.put("/api/vendors/:id", async (req, res) => {
    res.json(
      await Vendor.findByIdAndUpdate(req.params.id, req.body, { new: true })
    );
  });

  router.delete("/api/vendors/:id", async (req, res) => {
    await Vendor.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  });
};
