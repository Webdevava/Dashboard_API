const mongoose = require("mongoose");

const LocationSchema = new mongoose.Schema({
  DEVICE_ID: {
    type: Number,
    required: true,
    unique: true,
  },
  latitude: Number,
  longitude: Number,
  accuracy: Number,
  address: String,
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Location", LocationSchema);
