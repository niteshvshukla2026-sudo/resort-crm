const ctrl = require("../controllers/department.controller");

module.exports = (router) => {
  router.get("/api/departments", ctrl.listDepartments);
  router.post("/api/departments", ctrl.createDepartment);
  router.put("/api/departments/:id", ctrl.updateDepartment);
  router.delete("/api/departments/:id", ctrl.deleteDepartment);
};
