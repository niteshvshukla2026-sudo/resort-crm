module.exports = function createRecipeController(mongoose) {
  const Recipe = mongoose.model("Recipe");

  // ================= GET =================
  const listRecipes = async (req, res) => {
    try {
      const recipes = await Recipe.find().sort({ name: 1 });
      res.json(recipes);
    } catch (err) {
      console.error("listRecipes error:", err);
      res.status(500).json({ message: "Failed to load recipes" });
    }
  };

  // ================= CREATE =================
  const createRecipe = async (req, res) => {
    try {
      const payload = { ...req.body };

      if (!payload.code || !payload.name || !payload.recipeCategoryId) {
        return res.status(400).json({
          message: "Code, name and recipe category are required",
        });
      }

      if (!Array.isArray(payload.lines) || payload.lines.length === 0) {
        return res
          .status(400)
          .json({ message: "Recipe must have at least one ingredient" });
      }

      const exists = await Recipe.findOne({ code: payload.code });
      if (exists) {
        return res
          .status(400)
          .json({ message: "Recipe code already exists" });
      }

      payload.lines = payload.lines.map((ln) => ({
        itemId: ln.itemId,
        itemCategory: ln.itemCategory,
        qty: Number(ln.qty),
      }));

      const recipe = await Recipe.create(payload);
      res.json(recipe);
    } catch (err) {
      console.error("createRecipe error:", err);
      res.status(500).json({ message: "Failed to create recipe" });
    }
  };

  // ================= UPDATE =================
  const updateRecipe = async (req, res) => {
    try {
      const { id } = req.params;
      const payload = { ...req.body };

      if (payload.lines) {
        payload.lines = payload.lines.map((ln) => ({
          itemId: ln.itemId,
          itemCategory: ln.itemCategory,
          qty: Number(ln.qty),
        }));
      }

      const recipe = await Recipe.findByIdAndUpdate(id, payload, {
        new: true,
      });

      if (!recipe) {
        return res.status(404).json({ message: "Recipe not found" });
      }

      res.json(recipe);
    } catch (err) {
      console.error("updateRecipe error:", err);
      res.status(500).json({ message: "Failed to update recipe" });
    }
  };

  // ================= DELETE =================
  const deleteRecipe = async (req, res) => {
    try {
      const { id } = req.params;

      const deleted = await Recipe.findByIdAndDelete(id);
      if (!deleted) {
        return res.status(404).json({ message: "Recipe not found" });
      }

      res.json({ ok: true });
    } catch (err) {
      console.error("deleteRecipe error:", err);
      res.status(500).json({ message: "Failed to delete recipe" });
    }
  };

  return {
    listRecipes,
    createRecipe,
    updateRecipe,
    deleteRecipe,
  };
};
