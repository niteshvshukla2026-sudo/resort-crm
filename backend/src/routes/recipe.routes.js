const express = require("express");
const router = express.Router();
const controller = require("../controllers/recipe.controller");

router.get("/", controller.listRecipes);
router.post("/", controller.createRecipe);
router.put("/:id", controller.updateRecipe);
router.delete("/:id", controller.deleteRecipe);

module.exports = router;
