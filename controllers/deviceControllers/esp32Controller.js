const Esp32Data = require("../../models/Esp32Data");


exports.saveEsp32Data = async (payload) => {
 if (!payload.DEVICE_ID) {
   throw new Error("Message missing DEVICE_ID");
 }

 await Esp32Data.create({
   DEVICE_ID: payload.DEVICE_ID,
   data: payload,
 });
};

