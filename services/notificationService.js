// services/notificationService.js
const WebSocket = require("ws");

let wss; // WebSocket server instance

const initNotificationService = (server) => {
  wss = new WebSocket.Server({ server });

  wss.on("connection", (ws) => {
    console.log("Client connected");

    ws.on("close", () => {
      console.log("Client disconnected");
    });
  });
};

// Function to broadcast alerts to all connected clients
const sendAlertNotification = (alert) => {
  if (wss) {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(alert));
      }
    });
  }
};

module.exports = {
  initNotificationService,
  sendAlertNotification,
};
