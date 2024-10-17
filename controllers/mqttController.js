// server/controllers/mqttController.js
const mqttService = require("../services/mqttService");
const Events = require("../models/Events");
const Esp32Data = require("../models/Esp32Data");
const ApmConfig = require("../models/ApmConfig");

exports.getStatus = (req, res) => {
  const status =
    mqttService.client && mqttService.client.connected
      ? "connected"
      : "disconnected";
  res.json({ status });
};

exports.getLatestData = async (req, res) => {
  try {
    const [latestEvents, latestEsp32Data, latestApmConfig] =
      await Promise.all([
        Events.findOne().sort({ timestamp: -1 }).lean(),
        Esp32Data.findOne().sort({ timestamp: -1 }).lean(),
        ApmConfig.findOne().sort({ timestamp: -1 }).lean(),
      ]);

    res.json({
      Events: latestEvents,
      esp32Data: latestEsp32Data,
      apmConfig: latestApmConfig,
    });
  } catch (error) {
    console.error("Error fetching latest data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
