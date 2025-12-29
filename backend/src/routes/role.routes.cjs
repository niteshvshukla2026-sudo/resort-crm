const {
  listRoles,
  createRole,
  updateRole,
  deleteRole,
} = require("../controllers/role.controller");

module.exports = (router) => {
  router.get("/api/roles", listRoles);
  router.post("/api/roles", createRole);
  router.put("/api/roles/:id", updateRole);
  router.delete("/api/roles/:id", deleteRole);
};
