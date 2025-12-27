module.exports = (router, mongoose) => {
  const Role = mongoose.models.Role;

  router.get("/api/roles", async (_, res) => {
    res.json(await Role.find().lean());
  });

  router.post("/api/roles", async (req, res) => {
    res.status(201).json(await Role.create(req.body));
  });
};