const mongoose = require("mongoose");

const normalizeRecipe = (r) => {
  if (!r) return r;

  return {
    ...r,
    recipeCategoryId:
      r.recipeCategoryId || r.recipeCategory || undefined,

    yieldQty:
      r.yieldQty ??
      r.yield_qty ??
      undefined,

    yieldUom:
      r.yieldUom ||
      r.yield_uom ||
      undefined,

    lines: Array.isArray(r.lines)
      ? r.lines.map((ln) => ({
          itemId: ln.itemId || ln.item,
          qty: ln.qty ?? ln.quantity,
          itemCategory:
            ln.itemCategory ||
            ln.itemCategoryId ||
            ln.categoryId ||
            undefined,
        }))
      : [],
  };
};

exports.listRecipes = async (req, res) => {
  try {
    const Recipe = mongoose.models.Recipe;
    const docs = await Recipe.find()
      .sort({ createdAt: -1 })
      .lean();

    res.json(docs.map(normalizeRecipe));
  } catch (err) {
    console.error("LIST RECIPES ERROR", err);
    res.status(500).json({ message: "Failed to load recipes" });
  }
};

exports.createRecipe = async (req, res) => {
  try {
    const Recipe = mongoose.models.Recipe;

    const payload = normalizeRecipe(req.body);
    const doc = await Recipe.create(payload);

    res.status(201).json(normalizeRecipe(doc.toObject()));
  } catch (err) {
    console.error("CREATE RECIPE ERROR", err);
    res.status(500).json({ message: "Failed to create recipe" });
  }
};

exports.updateRecipe = async (req, res) => {
  try {
    const Recipe = mongoose.models.Recipe;

    const payload = normalizeRecipe(req.body);

    const updated = await Recipe.findByIdAndUpdate(
      req.params.id,
      { $set: payload },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Recipe not found" });
    }

    res.json(normalizeRecipe(updated.toObject()));
  } catch (err) {
    console.error("UPDATE RECIPE ERROR", err);
    res.status(500).json({ message: "Failed to update recipe" });
  }
};

exports.deleteRecipe = async (req, res) => {
  try {
    const Recipe = mongoose.models.Recipe;

    const deleted = await Recipe.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Recipe not found" });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("DELETE RECIPE ERROR", err);
    res.status(500).json({ message: "Failed to delete recipe" });
  }
};
