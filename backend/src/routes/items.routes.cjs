// backend/src/routes/item.routes.cjs
// ========================================
// ITEM ROUTES
// ========================================

module.exports = function (router) {
  const { protect, requirePermission } =
    require("../middlewares/auth.middleware");

  const itemCtrl =
    require("../controllers/item.controller.js");

  // READ
  router.get(
    "/api/items",
    protect,
    requirePermission("ITEMS", "READ"),
    itemCtrl.list
  );

  // CREATE
  router.post(
    "/api/items",
    protect,
    requirePermission("ITEMS", "CREATE"),
    itemCtrl.create
  );

  // UPDATE
  router.put(
    "/api/items/:id",
    protect,
    requirePermission("ITEMS", "UPDATE"),
    itemCtrl.update
  );

  // DELETE
  router.delete(
    "/api/items/:id",
    protect,
    requirePermission("ITEMS", "DELETE"),
    itemCtrl.remove
  );
};
