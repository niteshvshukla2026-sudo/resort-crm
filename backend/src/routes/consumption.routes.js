module.exports = (router, mongoose) => {
  const Consumption = mongoose.models.Consumption;

  router.get("/api/consumption", async (req, res) => {
    const filter = {};
    if (req.query.resort && req.query.resort !== "ALL") {
      filter.resort = req.query.resort;
    }
    res.json(await Consumption.find(filter).lean());
  });

  router.post("/api/consumption", async (req, res) => {
    res.status(201).json(await Consumption.create(req.body));
  });
};