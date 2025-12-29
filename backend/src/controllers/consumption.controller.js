import mongoose from "mongoose";

const Consumption = mongoose.models.Consumption;
const StoreStock = mongoose.models.StoreStock;
const Recipe = mongoose.models.Recipe;

/* =================================
   LIST
================================= */
export const listConsumption = async (req, res) => {
  try {
    const { resort } = req.query;
    const filter = {};
    if (resort && resort !== "ALL") filter.resort = resort;

    const docs = await Consumption.find(filter).lean();
    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch consumption" });
  }
};

/* =================================
   GET SINGLE
================================= */
export const getConsumption = async (req, res) => {
  const doc = await Consumption.findById(req.params.id).lean();
  if (!doc) return res.status(404).json({ message: "Consumption not found" });
  res.json(doc);
};

/* =================================
   CREATE + STOCK MINUS
================================= */
export const createConsumption = async (req, res) => {
  try {
    const data = req.body;

    const consumption = await Consumption.create(data);

    // 🔥 STOCK MINUS
    await applyConsumptionStockMinus(consumption);

    res.status(201).json(consumption);
  } catch (err) {
    console.error("CREATE CONSUMPTION ❌", err);
    res.status(500).json({ message: err.message });
  }
};

/* =================================
   UPDATE (NO STOCK ROLLBACK)
================================= */
export const updateConsumption = async (req, res) => {
  const doc = await Consumption.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true }
  );
  if (!doc) return res.status(404).json({ message: "Consumption not found" });
  res.json(doc);
};

/* =================================
   DELETE (NO ROLLBACK)
================================= */
export const deleteConsumption = async (req, res) => {
  const deleted = await Consumption.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ message: "Consumption not found" });
  res.json({ ok: true });
};

/* =================================
   🔥 CORE LOGIC — STOCK MINUS
================================= */
async function applyConsumptionStockMinus(consumption) {
  const storeId = consumption.storeFrom;

  // 1️⃣ DIRECT ITEM CONSUMPTION
  if (consumption.type === "LUMPSUM") {
    for (const ln of consumption.lines) {
      if (!ln.item || ln.qty <= 0) continue;

      await StoreStock.findOneAndUpdate(
        { store: storeId, item: ln.item },
        { $inc: { qty: -Math.abs(ln.qty) } },
        { upsert: true }
      );
    }
  }

  // 2️⃣ RECIPE BASED CONSUMPTION
  if (
    consumption.type === "RECIPE_LUMPSUM" ||
    consumption.type === "RECIPE_PORTION"
  ) {
    for (const ln of consumption.lines) {
      if (!ln.recipe || ln.qty <= 0) continue;

      const recipe = await Recipe.findById(ln.recipe).lean();
      if (!recipe || !Array.isArray(recipe.lines)) continue;

      for (const rLine of recipe.lines) {
        const totalQty =
          consumption.type === "RECIPE_PORTION"
            ? rLine.qty * ln.qty
            : rLine.qty;

        await StoreStock.findOneAndUpdate(
          { store: storeId, item: rLine.itemId },
          { $inc: { qty: -Math.abs(totalQty) } },
          { upsert: true }
        );
      }
    }
  }
}
