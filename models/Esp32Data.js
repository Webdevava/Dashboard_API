// server/models/Esp32Data.js
const mongoose = require("mongoose");
const esp32DataSchema = new mongoose.Schema({
  deviceId: { type: String, required: true },
  data: { type: mongoose.Schema.Types.Mixed, required: true },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Esp32Data", esp32DataSchema);
