module.exports = (router, mongoose) => {
  const Consumption = mongoose.models.Consumption;
  const StoreStock = mongoose.models.StoreStock;

  router.get("/api/consumption", async (req, res) => {
    const { resort } = req.query;
    const filter = resort ? { resort } : {};
    res.json(await Consumption.find(filter).lean());
  });

  router.post("/api/consumption", async (req, res) => {
    const doc = await Consumption.create(req.body);

    for (const line of req.body.lines || []) {
      await StoreStock.findOneAndUpdate(
        { store: req.body.storeFrom, item: line.item },
        { $inc: { qty: -line.qty } }
      );
    }

    res.status(201).json(doc);
  });
};
