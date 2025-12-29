const ctrl = require("../controllers/itemCategory.controller");

module.exports = (router) => {
  router.get("/api/item-categories", ctrl.listItemCategories);
  router.post("/api/item-categories", ctrl.createItemCategory);
  router.put("/api/item-categories/:id", ctrl.updateItemCategory);
  router.delete("/api/item-categories/:id", ctrl.deleteItemCategory);
};
