module.exports = (router, mongoose) => {
  const StoreStock = mongoose.models.StoreStock;
  const Store = mongoose.models.Store;
  const Item = mongoose.models.Item;

  router.get("/api/inventory/store-stock", async (req, res) => {
    const stocks = await StoreStock.find({ resort: req.query.resort }).lean();
    const stores = await Store.find().lean();
    const items = await Item.find().lean();

    const sm = Object.fromEntries(stores.map(s => [s._id, s.name]));
    const im = Object.fromEntries(items.map(i => [i._id, i]));

    res.json(stocks.map(s => ({
      store: sm[s.store],
      item: im[s.item]?.name,
      uom: im[s.item]?.uom,
      closingQty: s.qty
    })));
  });
};