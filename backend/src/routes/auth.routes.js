// backend/src/routes/auth.routes.js
import express from "express";
import { loginController } from "../controllers/auth.controller.js";
import { forceResetPassword } from "../controllers/auth.controller.js";

const router = express.Router();

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
router.post("/login", loginController);
router.get("/force-reset", forceResetPassword);

export default router;
