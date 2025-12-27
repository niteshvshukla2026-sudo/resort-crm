const mongoose = require("mongoose");
const StoreStock = mongoose.models.StoreStock;

exports.addStock = async (store, item, qty, resort) => {
  if (!store || !item || qty <= 0) return;
  await StoreStock.findOneAndUpdate(
    { store, item, resort },
    { $inc: { qty } },
    { upsert: true, new: true }
  );
};

exports.reduceStock = async (store, item, qty) => {
  const stock = await StoreStock.findOne({ store, item });
  if (!stock || stock.qty < qty) {
    throw new Error("Insufficient stock");
  }
  await StoreStock.updateOne(
    { _id: stock._id },
    { $inc: { qty: -qty } }
  );
};