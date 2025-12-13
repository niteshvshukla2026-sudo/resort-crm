import express from "express";
import {
  listStores,
  createStore,
  updateStore,
  deleteStore,
} from "../controllers/storeController.js";

const router = express.Router();

router.get("/", listStores);        // 🔥 uses query ?resort=
router.post("/", createStore);
router.put("/:id", updateStore);
router.delete("/:id", deleteStore);

export default router;
