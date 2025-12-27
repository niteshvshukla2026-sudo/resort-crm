const express = require("express");
const router = express.Router();
const controller = require("../controllers/resort.controller");

router.get("/", controller.listResorts);
router.post("/", controller.createResort);
router.put("/:id", controller.updateResort);
router.delete("/:id", controller.deleteResort);

module.exports = router;
