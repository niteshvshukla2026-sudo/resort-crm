const auth = require("../middlewares/auth.cjs");
const requirePermission = require("../middlewares/permission.cjs"); // ✅ separate file

module.exports = function (router) {
  const mongoose = require("mongoose"); // ✅ REAL mongoose
  const controller = require("../controllers/role.controller.cjs")(mongoose);

  // 👀 VIEW ROLES
  router.get(
    "/api/roles",
    auth,
    requirePermission("roles:read"),
    controller.listRoles
  );

  // ➕ CREATE ROLE
  router.post(
    "/api/roles",
    auth,
    requirePermission("roles:create"),
    controller.createRole
  );

  // ✏️ UPDATE ROLE
  router.put(
    "/api/roles/:id",
    auth,
    requirePermission("roles:update"),
    controller.updateRole
  );

  // 🗑 DELETE ROLE
  router.delete(
    "/api/roles/:id",
    auth,
    requirePermission("roles:delete"),
    controller.deleteRole
  );
};
