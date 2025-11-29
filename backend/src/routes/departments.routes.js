import express from "express";
import { createDepartment, listDepartments } from "../controllers/department.controller.js";
import { protect, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.get("/", listDepartments);
router.post("/", requireRole("SUPER_ADMIN"), createDepartment);

export default router;
