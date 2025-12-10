// backend/routes/vendorRoutes.js
const express = require("express");
const router = express.Router();
const vendorController = require("../controllers/vendorController");

// /api/vendors
router.get("/", vendorController.getVendors);
router.post("/", vendorController.createVendor);

// /api/vendors/:idOrCode
router.get("/:id", vendorController.getVendorByIdOrCode);
router.put("/:id", vendorController.updateVendor);
router.delete("/:id", vendorController.deleteVendor);

module.exports = router;
