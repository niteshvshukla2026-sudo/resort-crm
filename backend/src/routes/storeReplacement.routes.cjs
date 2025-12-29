const express = require("express");
const router = express.Router();

const {
  listReplacements,
  createReplacement,
  issueToVendor,
  createReplacementGrn,
} = require("../controllers/storeReplacement.controller");

// LIST
router.get("/api/store-replacements", listReplacements);

// CREATE
router.post("/api/store-replacements", createReplacement);

// ISSUE TO VENDOR
router.patch(
  "/api/store-replacements/:id/issue-vendor",
  issueToVendor
);

// CREATE GRN (REPLACEMENT)
router.post(
  "/api/store-replacements/:id/create-grn",
  createReplacementGrn
);

module.exports = router;
