const mongoose = require("mongoose");

// Assuming you've already set up your MongoDB connection

// Create a schema for the AFP collection
const afpSchema = new mongoose.Schema(
  {
    TS: Number,
    DEVICE_ID: Number,
    channel_id: String,
  },
  { collection: "AFP" }
);

// Create a schema for the Logo collection
const logoSchema = new mongoose.Schema(
  {
    TS: Number,
    DEVICE_ID: Number,
    channel_id: String,
  },
  { collection: "Logo" }
);

// Create models based on the schemas
const AFP = mongoose.model("AFP", afpSchema);
const Logo = mongoose.model("Logo", logoSchema);

// Export getAFP API
exports.getAFP = async (req, res) => {
  try {
    const deviceId = req.query.deviceId;

    if (!deviceId) {
      return res.status(400).json({ message: "DEVICE_ID is required" });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await AFP.countDocuments({ DEVICE_ID: deviceId });
    const data = await AFP.find({ DEVICE_ID: deviceId })
      .sort({ TS: -1 }) // Sort by TS in descending order (latest on top)
      .skip(skip)
      .limit(limit);

    res.json({
      total,
      page,
      limit,
      data,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Export getLogo API
exports.getLogo = async (req, res) => {
  try {
    const deviceId = req.query.deviceId;

    if (!deviceId) {
      return res.status(400).json({ message: "DEVICE_ID is required" });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await Logo.countDocuments({ DEVICE_ID: deviceId });
    const data = await Logo.find({ DEVICE_ID: deviceId })
      .sort({ TS: -1 }) // Sort by TS in descending order (latest on top)
      .skip(skip)
      .limit(limit);

    res.json({
      total,
      page,
      limit,
      data,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
