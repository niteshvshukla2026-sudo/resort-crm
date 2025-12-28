const auth = require("../middlewares/auth.cjs");
const requirePermission = require("../middlewares/permission.cjs");

module.exports = function (router, mongoose) {
  const controller = require("../controllers/recipe.controller.cjs")(mongoose);

  // 👀 VIEW
  router.get(
    "/api/recipes",
    auth,
    requirePermission("recipe:view"),
    controller.listRecipes
  );

  // ➕ CREATE
  router.post(
    "/api/recipes",
    auth,
    requirePermission("recipe:create"),
    controller.createRecipe
  );

  // ✏️ UPDATE
  router.put(
    "/api/recipes/:id",
    auth,
    requirePermission("recipe:update"),
    controller.updateRecipe
  );

  // 🗑 DELETE
  router.delete(
    "/api/recipes/:id",
    auth,
    requirePermission("recipe:delete"),
    controller.deleteRecipe
  );
};
