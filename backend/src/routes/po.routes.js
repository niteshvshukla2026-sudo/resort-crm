// routes/po.routes.js
const express = require("express");
const router = express.Router();
const poCtrl = require("../controllers/po.controller");

router.get("/", poCtrl.list);
router.get("/:id", poCtrl.getOne);
router.post("/", poCtrl.create);
router.put("/:id", poCtrl.update);
router.delete("/:id", poCtrl.delete);

module.exports = router;
