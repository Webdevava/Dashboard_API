// server/routes/mqttRoutes.js
const express = require("express");
const router = express.Router();
const mqttController = require("../controllers/mqttController");
const auth = require("../middleware/auth");

router.get("/status", mqttController.getStatus);
router.get("/latest-data", mqttController.getLatestData);

module.exports = router;
