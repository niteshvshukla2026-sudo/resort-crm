module.exports = (router, mongoose) => {
  const controller = require("../controllers/store.controller")(mongoose);

  router.get("/stores", controller.listStores);
  router.post("/stores", controller.createStore);
};
