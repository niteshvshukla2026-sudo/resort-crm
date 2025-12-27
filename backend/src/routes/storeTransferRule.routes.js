// backend/src/routes/storeTransferRule.routes.js
import express from "express";
import { protect } from "../middleware/auth.js";
import {
  getStoreTransferRules,
  createStoreTransferRule,
  updateStoreTransferRule,
  deleteStoreTransferRule,
} from "../controllers/storeTransferRuleController.js";

const router = express.Router();

// saari rules APIs ke liye login required
router.use(protect);

// (chaaho to yahan baad me SUPER_ADMIN check bhi add kar sakte ho)

router.get("/", getStoreTransferRules);
router.post("/", createStoreTransferRule);
router.put("/:id", updateStoreTransferRule);
router.delete("/:id", deleteStoreTransferRule);

export default router;
