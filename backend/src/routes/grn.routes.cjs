module.exports = (router, mongoose) => {
  const GRN = mongoose.models.GRN;
  const StoreStock = mongoose.models.StoreStock;

  router.get("/api/grn", async (req, res) => {
    res.json(await GRN.find().lean());
  });

  router.post("/api/grn", async (req, res) => {
    res.status(201).json(await GRN.create(req.body));
  });

  router.post("/api/grn/:id/close", async (req, res) => {
    const grn = await GRN.findById(req.params.id);
    for (const it of grn.items) {
      await StoreStock.findOneAndUpdate(
        { store: grn.store, item: it.item },
        { $inc: { qty: it.receivedQty } },
        { upsert: true }
      );
    }
    grn.status = "CLOSED";
    await grn.save();
    res.json(grn);
  });
};
