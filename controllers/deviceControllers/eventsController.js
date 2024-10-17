const Events = require("../../models/Events");
const Location = require("../../models/Location");
const axios = require("axios");
const { sendAlertNotification } = require("../../services/notificationService");

// Mapping of Type to Event Name
const eventTypeMapping = {
  1: "LOCATION",
  2: "GUEST_REGISTRATION",
  3: "MEMBER_GUEST_DECLARATION",
  4: "CONFIGURATION",
  5: "TAMPER_ALARM",
  6: "SOS_ALARM",
  7: "BATTERY_ALARM",
  8: "METER_INSTALLATION",
  9: "VOLTAGE_STATS",
  10: "TEMPERATURE_STATS",
  11: "NTP_SYNC",
  12: "AUDIENCE_SESSION_CLOSE",
  13: "NETWORK_LATCH",
  14: "REMOTE_PAIRING",
  15: "REMOTE_ACTIVITY",
  16: "SIM_ALERT",
  17: "SYSTEM_ALARM",
  18: "SYSTEM_INFO",
  19: "CONFIG_UPDATE",
  20: "ALIVE",
  21: "METER_OTA",
  22: "BATTERY_VOLTAGE",
  23: "BOOT",
  24: "BOOT_V2",
  25: "STB",
  26: "DERIVED_TV_STATUS",
  27: "AUDIO_SOURCE",
  28: "AUDIO_FINGERPRINT",
  29: "LOGO_DETECTED",
};

const alertTypes = [5, 6, 7, 16, 17]; // Event types that are considered alerts

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

exports.saveEventData = async (payload) => {
  if (!payload.DEVICE_ID || !payload.ID || !payload.TS || !payload.Type) {
    throw new Error("Invalid apm/device message format");
  }

  const eventName = eventTypeMapping[payload.Type] || "UNKNOWN_EVENT";

  const eventData = {
    ID: payload.ID,
    DEVICE_ID: payload.DEVICE_ID,
    TS: payload.TS,
    Type: payload.Type,
    Event_Name: eventName,
    Details: payload.Details || {},
  };

  if (alertTypes.includes(payload.Type)) {
    eventData.AlertType = "generated";
    sendAlertNotification(eventData);
  }

  await Events.create(eventData);

  // Handle Type 1 LOCATION event
  if (payload.Type === 1 && payload.Details && payload.Details.cell_info) {
    try {
      const geoLocation = await convertLocationToLatLon(
        payload.Details.cell_info
      );

      const locationData = {
        DEVICE_ID: payload.DEVICE_ID,
        ...geoLocation,
        lastUpdated: new Date(),
      };

      await Location.findOneAndUpdate(
        { DEVICE_ID: payload.DEVICE_ID },
        locationData,
        { upsert: true, new: true }
      );
    } catch (error) {
      console.error("Error processing location data:", error);
      // You might want to handle this error differently, depending on your requirements
    }
  }
};

// API to get all events with pagination and search
exports.getAllEvents = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      deviceIdRange = "",
      type,
    } = req.query;

    const filters = {};

    // Search by DEVICE_ID range if specified
    if (deviceIdRange) {
      const [minId, maxId] = deviceIdRange.split("-").map(Number);
      filters.DEVICE_ID = { $gte: minId, $lte: maxId };
    }

    // Search by Type if specified
    if (type) {
      filters.Type = type;
    }

    // Global search in Event_Name and Details
    const searchRegex = new RegExp(search, "i"); // Case insensitive
    const searchQuery = {
      $or: [
        { Event_Name: searchRegex },
        { "Details.description": searchRegex }, // Assuming Details has a description field
      ],
    };

    // Combine filters with search query
    const query = { ...filters, ...searchQuery };

    const events = await Events.find(query)
      .sort({ TS: -1 }) // Latest on top
      .skip((page - 1) * limit) // Pagination skip
      .limit(Number(limit)); // Pagination limit

    const totalEvents = await Events.countDocuments(query); // Total count for pagination

    res.status(200).json({
      total: totalEvents,
      page: Number(page),
      limit: Number(limit),
      events,
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getLatestEventsByType = async (req, res) => {
  try {
    const { deviceId } = req.query;

    if (!deviceId) {
      return res.status(400).json({ message: "Device ID is required" });
    }

    // Convert deviceId to number if it's stored as a number in the database
    const numericDeviceId = Number(deviceId);

    const latestEvents = await Events.aggregate([
      {
        $match: {
          DEVICE_ID: isNaN(numericDeviceId) ? deviceId : numericDeviceId,
        },
      },
      { $sort: { TS: -1 } },
      {
        $group: {
          _id: "$Type",
          latestEvent: { $first: "$$ROOT" },
        },
      },
      { $replaceRoot: { newRoot: "$latestEvent" } },
      { $sort: { Type: 1 } },
    ]);

    if (latestEvents.length === 0) {
      // If no events found, check if the device exists
      const deviceExists = await Events.findOne({ DEVICE_ID: deviceId }).select(
        "DEVICE_ID"
      );
      if (!deviceExists) {
        return res
          .status(404)
          .json({ message: "No events found for this device ID" });
      }
    }

    res.status(200).json(latestEvents);
  } catch (error) {
    console.error("Error fetching latest events by type:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};