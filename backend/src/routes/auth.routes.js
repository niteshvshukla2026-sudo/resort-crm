import express from "express";
import { login, forceResetPassword } from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/login", login);
router.get("/force-reset", forceResetPassword);

export default router;
