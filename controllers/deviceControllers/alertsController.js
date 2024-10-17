// controllers/deviceControllers/alertsController.js
const Events = require("../../models/Events");

const alertTypes = [5, 6, 7, 16, 17]; // Event types that are considered alerts

// Get alerts with optional filtering by type and alertType
exports.getAlerts = async (req, res) => {
  const { page = 1, limit = 10, type, alertType } = req.query; // Added alertType parameter
  const query = { Type: { $in: alertTypes } }; // Default query to include all alert types

  // Filter by specific Type if provided
  if (type) {
    query.Type = type;
  }

  // Filter by alertType if provided
  if (alertType) {
    query.AlertType = alertType; // Assuming AlertType is a field in your Events collection
  }

  try {
    const alerts = await Events.find(query)
      .sort({ TS: -1 }) // Sort by timestamp (latest first)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const totalAlerts = await Events.countDocuments(query);

    res.json({
      alerts,
      total: totalAlerts,
      page: Number(page),
      totalPages: Math.ceil(totalAlerts / limit),
    });
  } catch (error) {
    console.error("Error fetching alerts:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
