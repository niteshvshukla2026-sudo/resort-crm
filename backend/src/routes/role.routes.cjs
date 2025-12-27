const auth = require("../middleware/auth.cjs");
const requirePermission = require("../middleware/permission.cjs");

module.exports = function (router, mongoose) {
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

  // 🗑 DELETE ROLE (optional)
  router.delete(
    "/api/roles/:id",
    auth,
    requirePermission("roles:delete"),
    controller.deleteRole
  );
};
