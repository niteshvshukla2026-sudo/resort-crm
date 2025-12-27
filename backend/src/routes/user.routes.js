module.exports = (router, mongoose) => {
  const User = mongoose.models.User;

  router.get("/api/users", async (_, res) => {
    res.json(await User.find().lean());
  });

  router.post("/api/users", async (req, res) => {
    res.status(201).json(await User.create(req.body));
  });

  router.put("/api/users/:id", async (req, res) => {
    res.json(await User.findByIdAndUpdate(req.params.id, req.body, { new: true }));
  });
};