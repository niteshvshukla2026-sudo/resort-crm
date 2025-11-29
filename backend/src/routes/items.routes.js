import express from "express";
import { createItem, listItems } from "../controllers/item.controller.js";
import { protect, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.get("/", listItems);
router.post("/", requireRole("SUPER_ADMIN"), createItem);

export default router;
