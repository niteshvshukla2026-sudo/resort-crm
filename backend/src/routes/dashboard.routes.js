const express = require("express");
const router = express.Router();
const controller = require("../controllers/dashboard.controller");

router.get("/resort/:resortId/kpi", controller.getResortKpi);

module.exports = router;
