// backend/src/routes/auth.routes.js
import express from "express";
import { loginController } from "../controllers/auth.controller.js";

const router = express.Router();

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
router.post("/login", loginController);

export default router;
