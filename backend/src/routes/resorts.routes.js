import express from "express";
import { createResort, listResorts } from "../controllers/resort.controller.js";
import { protect, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.use(protect, requireRole("SUPER_ADMIN"));

router.get("/", listResorts);
router.post("/", createResort);

export default router;
