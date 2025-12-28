const auth = require("../middlewares/auth.cjs");
const requirePermission = require("../middlewares/permission.cjs");

module.exports = function (router, mongoose) {
  const controller = require("../controllers/user.controller.cjs")(mongoose);

  // 👀 VIEW USERS
  router.get(
    "/api/users",
    auth,
    requirePermission("user:view"),
    controller.listUsers
  );

  // ➕ CREATE USER
  router.post(
    "/api/users",
    auth,
    requirePermission("user:create"),
    controller.createUser
  );

  // ✏️ UPDATE USER
  router.put(
    "/api/users/:id",
    auth,
    requirePermission("user:update"),
    controller.updateUser
  );

  // 🗑 DELETE USER
  router.delete(
    "/api/users/:id",
    auth,
    requirePermission("user:delete"),
    controller.deleteUser
  );
};
