const auth = require("../middleware/auth.cjs");
const requirePermission = require("../middleware/permission.cjs");

module.exports = function (router, mongoose) {
  const controller = require("../controllers/resort.controller.cjs")(mongoose);

  // 👀 VIEW
  router.get(
    "/api/resorts",
    auth,
    requirePermission("resort:view"),
    controller.listResorts
  );

  // ➕ CREATE
  router.post(
    "/api/resorts",
    auth,
    requirePermission("resort:create"),
    controller.createResort
  );

  // ✏️ UPDATE
  router.put(
    "/api/resorts/:id",
    auth,
    requirePermission("resort:update"),
    controller.updateResort
  );

  // 🗑 DELETE
  router.delete(
    "/api/resorts/:id",
    auth,
    requirePermission("resort:delete"),
    controller.deleteResort
  );
};
