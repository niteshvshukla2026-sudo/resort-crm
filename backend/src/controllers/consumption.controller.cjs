const mongoose = require("mongoose");

const Consumption = mongoose.models.Consumption;
const StoreStock = mongoose.models.StoreStock;
const Recipe = mongoose.models.Recipe;

/* ===============================
   LIST
================================ */
exports.list = async (req, res) => {
  try {
    const { resort } = req.query;

    const filter = {};
    if (resort && resort !== "ALL") filter.resort = resort;

    const docs = await Consumption.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    res.json(docs);
  } catch (err) {
    console.error("LIST CONSUMPTION ❌", err);
    res.status(500).json({ message: "Failed to load consumption" });
  }
};

/* ===============================
   GET ONE
================================ */
exports.getOne = async (req, res) => {
  try {
    const doc = await Consumption.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ message: "Not found" });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch consumption" });
  }
};

/* ===============================
   CREATE
================================ */
exports.create = async (req, res) => {
  try {
    const data = req.body;

    // 1️⃣ Save consumption
    const doc = await Consumption.create({
      ...data,
      createdBy: req.user?.id || "SYSTEM",
    });

    // 2️⃣ STOCK DEDUCTION
    if (data.type === "LUMPSUM") {
      for (const ln of data.lines || []) {
        if (!ln.item || !ln.qty) continue;

        const stock = await StoreStock.findOne({
          store: data.storeFrom,
          item: ln.item,
        });

        if (!stock || stock.qty < ln.qty) {
          return res.status(400).json({
            message: "Insufficient stock",
          });
        }

        await StoreStock.updateOne(
          { _id: stock._id },
          { $inc: { qty: -ln.qty } }
        );
      }
    }

    // 3️⃣ RECIPE BASED
    if (data.type !== "LUMPSUM") {
      for (const ln of data.lines || []) {
        if (!ln.recipe || !ln.qty) continue;

        const recipe = await Recipe.findById(ln.recipe).lean();
        if (!recipe) continue;

        const factor =
          recipe.yieldQty && recipe.yieldQty > 0
            ? ln.qty / recipe.yieldQty
            : ln.qty;

        for (const ing of recipe.lines || []) {
          const deductQty = factor * Number(ing.qty || 0);

          const stock = await StoreStock.findOne({
            store: data.storeFrom,
            item: ing.itemId,
          });

          if (!stock || stock.qty < deductQty) {
            return res.status(400).json({
              message: "Insufficient stock for recipe",
            });
          }

          await StoreStock.updateOne(
            { _id: stock._id },
            { $inc: { qty: -deductQty } }
          );
        }
      }
    }

    res.status(201).json(doc);
  } catch (err) {
    console.error("CREATE CONSUMPTION ❌", err);
    res.status(500).json({ message: "Failed to create consumption" });
  }
};

/* ===============================
   UPDATE
================================ */
exports.update = async (req, res) => {
  try {
    const doc = await Consumption.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    if (!doc) return res.status(404).json({ message: "Not found" });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: "Failed to update consumption" });
  }
};

/* ===============================
   DELETE
================================ */
exports.remove = async (req, res) => {
  try {
    const doc = await Consumption.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: "Not found" });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete consumption" });
  }
};
