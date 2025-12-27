const mongoose = require("mongoose");
const Consumption = mongoose.models.Consumption;
const StoreStock = mongoose.models.StoreStock;
const Recipe = mongoose.models.Recipe;

exports.list = async (req, res) => {
  const filter = {};
  if (req.query.resort && req.query.resort !== "ALL") filter.resort = req.query.resort;
  res.json(await Consumption.find(filter).lean());
};

exports.create = async (req, res) => {
  const data = req.body;
  const doc = await Consumption.create(data);

  if (data.type === "LUMPSUM") {
    for (const l of data.lines) {
      await StoreStock.updateOne(
        { store: data.storeFrom, item: l.item },
        { $inc: { qty: -Number(l.qty) } }
      );
    }
  }

  if (data.type !== "LUMPSUM") {
    for (const l of data.lines) {
      const recipe = await Recipe.findById(l.recipe);
      if (!recipe) continue;
      for (const ing of recipe.lines) {
        await StoreStock.updateOne(
          { store: data.storeFrom, item: ing.itemId },
          { $inc: { qty: -Number(ing.qty) * Number(l.qty) } }
        );
      }
    }
  }

  res.status(201).json(doc);
};