// server/models/ApmConfig.js
const mongoose = require("mongoose");

const apmConfigSchema = new mongoose.Schema({
  deviceId: { type: String, required: true },
  config: { type: mongoose.Schema.Types.Mixed, required: true },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("ApmConfig", apmConfigSchema);
