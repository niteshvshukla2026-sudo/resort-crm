// backend/src/routes/store.routes.cjs
module.exports = (router) => {
  const storeCtrl = require("../controllers/store.controller.js");

  router.get("/api/stores", storeCtrl.list);
  router.post("/api/stores", storeCtrl.create);
  router.put("/api/stores/:id", storeCtrl.update);
  router.delete("/api/stores/:id", storeCtrl.remove);
};
