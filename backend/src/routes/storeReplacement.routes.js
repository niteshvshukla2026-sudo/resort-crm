const express = require("express");
const router = express.Router();
const controller = require("../controllers/storeReplacement.controller");

router.get("/", controller.listReplacements);
router.post("/", controller.createReplacement);
router.patch("/:id/issue-vendor", controller.issueToVendor);
router.post("/:id/create-grn", controller.createReplacementGRN);

module.exports = router;
