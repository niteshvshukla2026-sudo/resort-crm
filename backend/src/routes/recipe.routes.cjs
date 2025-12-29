const ctrl = require("../controllers/recipe.controller");

module.exports = (router) => {
  router.get("/api/recipes", ctrl.listRecipes);
  router.post("/api/recipes", ctrl.createRecipe);
  router.put("/api/recipes/:id", ctrl.updateRecipe);
  router.delete("/api/recipes/:id", ctrl.deleteRecipe);
};
