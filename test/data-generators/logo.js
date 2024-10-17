const mongoose = require("mongoose");

// MongoDB connection setup
mongoose.connect(
  "mongodb+srv://ankurauti:ankurauti02@cluster0.7ikri.mongodb.net/indi_test?retryWrites=true&w=majority&appName=Cluster0",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

mongoose.connection.on("connected", () => {
  console.log("Connected to MongoDB");
});

mongoose.connection.on("error", (err) => {
  console.log("MongoDB connection error:", err);
});

// Create a schema for the Logo collection
const afpSchema = new mongoose.Schema(
  {
    TS: Number,
    DEVICE_ID: Number,
    channel_id: String,
    accuracy: Number, // New field for accuracy
  },
  { collection: "Logo" }
);

// Create a model based on the schema
const Logo = mongoose.model("Logo", afpSchema);

// Predefined array of channel IDs
const channelIds = [
  "Channel1",
  "Karusel",
  "Kinopoisk",
  "MatchTV",
  "Mir",
  "MuzTV",
  "NTV",
  "OTR",
  "RenTV",
  "Russia24",
  "RussiaK",
  "Spas",
  "TB3",
  "THT",
  "TVCenter",
  "YouTube",
  "Zvezda",
  "STS",
  "NDTV",
  "GodOfWar",
];

// Function to generate random data
const generateDummyData = () => {
  const data = {
    TS: Date.now(), // Real-time timestamp
    DEVICE_ID: 100001, // Fixed device ID
    channel_id: channelIds[Math.floor(Math.random() * channelIds.length)], // Random channel ID
    accuracy: parseFloat(Math.random().toFixed(2)), // Random accuracy between 0 and 1 with two decimals
  };

  return data;
};

// Function to insert data into MongoDB every 5 seconds
const insertData = async () => {
  const dummyData = generateDummyData();

  try {
    const newLogo = new Logo(dummyData);
    await newLogo.save();
    console.log("Data inserted:", dummyData);
  } catch (error) {
    console.log("Error inserting data:", error.message);
  }
};

// Generate and insert data every 5 seconds
setInterval(insertData, 5000);
