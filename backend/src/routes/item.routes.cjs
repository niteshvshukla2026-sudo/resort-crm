const auth = require("../middlewares/auth.cjs");
const requirePermission = require("../middlewares/permission.cjs");

module.exports = function (router, mongoose) {
  const controller = require("../controllers/item.controller.cjs")(mongoose);

  // 👀 VIEW
  router.get(
    "/api/items",
    auth,
    requirePermission("item:view"),
    controller.listItems
  );

  // ➕ CREATE
  router.post(
    "/api/items",
    auth,
    requirePermission("item:create"),
    controller.createItem
  );

  // ✏️ UPDATE
  router.put(
    "/api/items/:id",
    auth,
    requirePermission("item:update"),
    controller.updateItem
  );

  // 🗑 DELETE
  router.delete(
    "/api/items/:id",
    auth,
    requirePermission("item:delete"),
    controller.deleteItem
  );
};
