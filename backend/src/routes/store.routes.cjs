const auth = require("../middleware/auth.cjs");
const requirePermission = require("../middleware/permission.cjs");

module.exports = function (router, mongoose) {
  const controller = require("../controllers/store.controller.cjs")(mongoose);

  // 👀 VIEW (resort-wise)
  router.get(
    "/api/stores",
    auth,
    requirePermission("store:view"),
    controller.listStores
  );

  // ➕ CREATE
  router.post(
    "/api/stores",
    auth,
    requirePermission("store:create"),
    controller.createStore
  );

  // ✏️ UPDATE
  router.put(
    "/api/stores/:id",
    auth,
    requirePermission("store:update"),
    controller.updateStore
  );

  // 🗑 DELETE
  router.delete(
    "/api/stores/:id",
    auth,
    requirePermission("store:delete"),
    controller.deleteStore
  );
};
