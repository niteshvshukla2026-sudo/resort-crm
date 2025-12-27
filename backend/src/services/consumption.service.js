const mongoose = require("mongoose");
const StoreStock = mongoose.models.StoreStock;
const Recipe = mongoose.models.Recipe;

exports.consumeItems = async (data) => {
  if (data.type === "LUMPSUM") {
    for (const line of data.lines || []) {
      const stock = await StoreStock.findOne({
        store: data.storeFrom,
        item: line.item,
      });

      if (!stock || stock.qty < line.qty) {
        throw new Error("Insufficient stock");
      }

      await StoreStock.updateOne(
        { _id: stock._id },
        { $inc: { qty: -Number(line.qty) } }
      );
    }
  }

  if (data.type !== "LUMPSUM") {
    for (const line of data.lines || []) {
      const recipe = await Recipe.findById(line.recipe);
      if (!recipe) continue;

      for (const ing of recipe.lines) {
        const deductQty = Number(ing.qty) * Number(line.qty);

        const stock = await StoreStock.findOne({
          store: data.storeFrom,
          item: ing.itemId,
        });

        if (!stock || stock.qty < deductQty) {
          throw new Error("Insufficient stock for recipe");
        }

        await StoreStock.updateOne(
          { _id: stock._id },
          { $inc: { qty: -deductQty } }
        );
      }
    }
  }
};