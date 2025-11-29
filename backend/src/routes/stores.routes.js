import express from "express";
import { createStore, listStores } from "../controllers/store.controller.js";
import { protect, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.get("/", listStores);
router.post("/", requireRole("SUPER_ADMIN"), createStore);

export default router;
