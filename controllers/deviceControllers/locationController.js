const Events = require("../../models/Events");
const axios = require("axios");

const convertLocationToLatLon = async (cellInfo) => {
  const { mcc, mnc, lac, cid } = cellInfo.cell_towers;

  const unwiredLabsPayload = {
    token: "pk.c4f2e3d84bcc6bae8333620bb3eaf8e1", // Replace with your actual token
    radio: "gsm",
    mcc: mcc,
    mnc: mnc,
    cells: [{ lac, cid }],
    address: 1,
  };

  try {
    const response = await axios.post(
      "https://unwiredlabs.com/v2/process.php",
      unwiredLabsPayload
    );

    if (response.data.status === "ok") {
      const { lat, lon, accuracy, address } = response.data;
      return {
        latitude: lat,
        longitude: lon,
        accuracy,
        address,
      };
    } else {
      throw new Error("Geolocation service error");
    }
  } catch (error) {
    console.error("Error in location conversion:", error);
    throw error;
  }
};

exports.getLatestDeviceLocation = async (req, res) => {
  try {
    const { deviceId } = req.params;

    const latestLocation = await Events.findOne({
      DEVICE_ID: parseInt(deviceId),
      Type: 1, // LOCATION event type
    }).sort({ TS: -1 }); // Get the latest event

    if (!latestLocation) {
      return res
        .status(404)
        .json({ message: "No location data found for this device" });
    }

    if (
      !latestLocation.Details ||
      !latestLocation.Details.cell_info ||
      !latestLocation.Details.cell_info.cell_towers
    ) {
      return res.status(400).json({ message: "Invalid location data format" });
    }

    const geoLocation = await convertLocationToLatLon(
      latestLocation.Details.cell_info
    );

    const locationData = {
      DEVICE_ID: latestLocation.DEVICE_ID,
      ID: latestLocation.ID,
      TS: latestLocation.TS,
      Type: latestLocation.Type,
      Event_Name: latestLocation.Event_Name,
      original_cell_info: latestLocation.Details.cell_info,
      geolocation: geoLocation,
      timestamp: latestLocation.timestamp,
    };

    res.status(200).json(locationData);
  } catch (error) {
    console.error("Error fetching latest device location:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
