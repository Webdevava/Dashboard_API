// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http"); // Import HTTP module
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const roleRoutes = require("./routes/roleRoutes");
const eventsRoutes = require("./routes/eventsRoutes");
const mqttService = require("./services/mqttService");
const mqttRoutes = require("./routes/mqttRoutes");
const { initNotificationService } = require("./services/notificationService"); // Import the notification service

const app = express();

app.use(cors());

const server = http.createServer(app); // Create an HTTP server using Express

// Middleware
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Initialize MQTT Service
mqttService
  .connect()
  .then(() => {
    console.log("MQTT Service initialized successfully");
  })
  .catch((err) => {
    console.error("Failed to initialize MQTT Service:", err);
  });

// Initialize Notification Service
initNotificationService(server); // Initialize the notification service with the HTTP server

// Graceful shutdown handler
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  mqttService.disconnect();
  mongoose.connection.close(() => {
    console.log("MongoDB connection closed.");
    process.exit(0);
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/mqtt", mqttRoutes);
app.use("/api/events", eventsRoutes);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`)); // Use the HTTP server to listen
