// controllers/apmConfigController.js
const ApmConfig = require("../../models/ApmConfig");

exports.saveConfigData = async (payload) => {
  if (!payload.DEVICE_ID) {
    throw new Error("Message missing DEVICE_ID");
  }

  await ApmConfig.create({
    DEVICE_ID: payload.DEVICE_ID,
    config: payload,
  });
};
