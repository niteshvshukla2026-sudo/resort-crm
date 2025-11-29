import express from "express";
import { login, createInitialSuperAdmin } from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/login", login);
router.post("/init-super-admin", createInitialSuperAdmin);

export default router;
