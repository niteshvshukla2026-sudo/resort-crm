const express = require("express");
const router = express.Router();
const controller = require("../controllers/department.controller");

router.get("/", controller.listDepartments);
router.post("/", controller.createDepartment);
router.put("/:id", controller.updateDepartment);
router.delete("/:id", controller.deleteDepartment);

module.exports = router;
