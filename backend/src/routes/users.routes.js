import express from "express";
import { createUser, listUsers } from "../controllers/user.controller.js";
import { protect, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.use(protect, requireRole("SUPER_ADMIN"));

router.get("/", listUsers);
router.post("/", createUser);

export default router;
