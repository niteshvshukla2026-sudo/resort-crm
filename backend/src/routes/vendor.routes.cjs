const auth = require("../middleware/auth.cjs");
const requirePermission = require("../middleware/permission.cjs");

module.exports = function (router, mongoose) {
  const controller = require("../controllers/vendor.controller.cjs")(mongoose);

  // 👀 VIEW
  router.get(
    "/api/vendors",
    auth,
    requirePermission("vendor:view"),
    controller.listVendors
  );

  // ➕ CREATE
  router.post(
    "/api/vendors",
    auth,
    requirePermission("vendor:create"),
    controller.createVendor
  );

  // ✏️ UPDATE
  router.put(
    "/api/vendors/:id",
    auth,
    requirePermission("vendor:update"),
    controller.updateVendor
  );

  // 🗑 DELETE
  router.delete(
    "/api/vendors/:id",
    auth,
    requirePermission("vendor:delete"),
    controller.deleteVendor
  );
};
