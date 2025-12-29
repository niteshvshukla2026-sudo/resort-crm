const ctrl = require("../controllers/store.controller");

module.exports = (router) => {
  router.get("/api/stores", ctrl.listStores);
  router.post("/api/stores", ctrl.createStore);
  router.put("/api/stores/:id", ctrl.updateStore);
  router.delete("/api/stores/:id", ctrl.deleteStore);
};
