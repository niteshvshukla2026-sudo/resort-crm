const auth = require("../middleware/auth.cjs");
const requirePermission = require("../middleware/permission.cjs");

module.exports = function (router, mongoose) {
  const controller = require("../controllers/department.controller.cjs")(
    mongoose
  );

  // 👀 VIEW
  router.get(
    "/api/departments",
    auth,
    requirePermission("department:view"),
    controller.listDepartments
  );

  // ➕ CREATE
  router.post(
    "/api/departments",
    auth,
    requirePermission("department:create"),
    controller.createDepartment
  );

  // ✏️ UPDATE
  router.put(
    "/api/departments/:id",
    auth,
    requirePermission("department:update"),
    controller.updateDepartment
  );

  // 🗑 DELETE
  router.delete(
    "/api/departments/:id",
    auth,
    requirePermission("department:delete"),
    controller.deleteDepartment
  );
};
