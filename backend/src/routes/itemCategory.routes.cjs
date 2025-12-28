const auth = require("../middlewares/auth.cjs");
const requirePermission = require("../middlewares/permission.cjs");

module.exports = function (router, mongoose) {
  const controller = require("../controllers/itemCategory.controller.cjs")(
    mongoose
  );

  // 👀 VIEW
  router.get(
    "/api/item-categories",
    auth,
    requirePermission("itemCategory:view"),
    controller.listItemCategories
  );

  // ➕ CREATE
  router.post(
    "/api/item-categories",
    auth,
    requirePermission("itemCategory:create"),
    controller.createItemCategory
  );

  // ✏️ UPDATE
  router.put(
    "/api/item-categories/:id",
    auth,
    requirePermission("itemCategory:update"),
    controller.updateItemCategory
  );

  // 🗑 DELETE
  router.delete(
    "/api/item-categories/:id",
    auth,
    requirePermission("itemCategory:delete"),
    controller.deleteItemCategory
  );
};
