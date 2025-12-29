// backend/src/routes/role.routes.js
import express from "express";
import { protect } from "../middleware/auth.js";   // ✅ sirf protect

import {
  getMetadata,
  getRoles,
  createRole,
  updateRole,
  deleteRole,
} from "../controllers/roleController.js";

const router = express.Router();

// yeh sirf logged-in users ke liye roles APIs allow karega
router.use(protect);

router.get("/meta", getMetadata);   // GET /api/roles/meta
router.get("/", getRoles);          // GET /api/roles
router.post("/", createRole);       // POST /api/roles
router.put("/:id", updateRole);     // PUT /api/roles/:id
router.delete("/:id", deleteRole);  // DELETE /api/roles/:id

export default router;
