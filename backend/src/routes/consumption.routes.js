// backend/src/routes/consumption.routes.js
import express from "express";
import { protect } from "../middleware/auth.js";
import {
  getConsumptions,
  getConsumptionById,
  createConsumption,
  updateConsumption,
  deleteConsumption,
} from "../controllers/consumptionController.js";

const router = express.Router();

// sab routes ke liye login required
router.use(protect);

router.get("/", getConsumptions);
router.get("/:id", getConsumptionById);
router.post("/", createConsumption);
router.put("/:id", updateConsumption);
router.delete("/:id", deleteConsumption);

export default router;
