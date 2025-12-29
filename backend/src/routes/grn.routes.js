// routes/grn.routes.js
const express = require("express");
const router = express.Router();
const grnCtrl = require("../controllers/grn.controller");

router.get("/", grnCtrl.list);
router.get("/:id", grnCtrl.getOne);
router.post("/", grnCtrl.create);
router.put("/:id", grnCtrl.update);
router.delete("/:id", grnCtrl.delete);

module.exports = router;
