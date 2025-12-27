const mongoose = require("mongoose");

exports.listRecipes = async (req, res) => {
  try {
    const Recipe = mongoose.models.Recipe;
    const data = await Recipe.find().lean();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Failed to load recipes" });
  }
};

exports.createRecipe = async (req, res) => {
  try {
    const Recipe = mongoose.models.Recipe;
    const doc = await Recipe.create(req.body);
    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ message: "Failed to create recipe" });
  }
};

exports.updateRecipe = async (req, res) => {
  try {
    const Recipe = mongoose.models.Recipe;
    const doc = await Recipe.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: "Failed to update recipe" });
  }
};

exports.deleteRecipe = async (req, res) => {
  try {
    const Recipe = mongoose.models.Recipe;
    await Recipe.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete recipe" });
  }
};
