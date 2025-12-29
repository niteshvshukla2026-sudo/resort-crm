const ctrl = require("../controllers/item.controller");

module.exports = (router) => {
  router.get("/api/items", ctrl.listItems);
  router.post("/api/items", ctrl.createItem);
  router.put("/api/items/:id", ctrl.updateItem);
  router.delete("/api/items/:id", ctrl.deleteItem);
};
