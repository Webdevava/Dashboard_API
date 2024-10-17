const express = require("express");
const router = express.Router();
const eventsController = require("../controllers/deviceControllers/eventsController");
const alertsController = require("../controllers/deviceControllers/alertsController");
const liveMonitorController = require("../controllers/deviceControllers/liveMonitorController");
const {
  getLatestDeviceLocation,
} = require("../controllers/deviceControllers/locationController");

// Route to save event data
router.post("/events", async (req, res) => {
  try {
    await eventsController.saveEventData(req.body);
    res.status(201).json({ message: "Event data saved successfully." });
  } catch (error) {
    console.error("Error saving event data:", error);
    res.status(400).json({ message: error.message });
  }
});

// Route to get all events with pagination and search
router.get("/", eventsController.getAllEvents);

// Route to get only alerts with pagination and search
router.get("/alerts", alertsController.getAlerts);

// Route to get the latest device location
router.get("/location/:deviceId", getLatestDeviceLocation);

// New route to get the latest event of each Type for a specific device ID
router.get("/latest", eventsController.getLatestEventsByType);

router.get("/afp", liveMonitorController.getAFP);
router.get("/logo", liveMonitorController.getLogo);

module.exports = router;
