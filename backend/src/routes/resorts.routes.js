// backend/src/routes/resort.routes.js
import express from "express";
import * as ctrl from "../controllers/resort.controller.js";

const router = express.Router();

router.get("/", ctrl.listResorts);
router.get("/:id", ctrl.getResort);
router.post("/", ctrl.createResort);
router.put("/:id", ctrl.updateResort);
router.delete("/:id", ctrl.deleteResort);

export default router;
