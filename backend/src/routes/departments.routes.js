// backend/src/routes/department.routes.js
import express from "express";
import * as ctrl from "../controllers/department.controller.js";

const router = express.Router();

router.get("/", ctrl.listDepartments);
router.get("/:id", ctrl.getDepartment);
router.post("/", ctrl.createDepartment);
router.put("/:id", ctrl.updateDepartment);
router.delete("/:id", ctrl.deleteDepartment);

export default router;
