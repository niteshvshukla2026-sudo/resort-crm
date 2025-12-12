import express from "express";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.get("/", async (req, res) => {
  res.json([]);
});

router.post("/", async (req, res) => {
  res.status(201).json({ message: "Not implemented yet", body: req.body });
});

export default router;
