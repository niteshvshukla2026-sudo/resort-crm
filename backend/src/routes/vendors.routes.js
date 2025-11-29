import express from "express";
import { createVendor, listVendors } from "../controllers/vendor.controller.js";
import { protect, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.get("/", listVendors);
router.post("/", requireRole("SUPER_ADMIN"), createVendor);

export default router;
