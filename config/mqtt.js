    // server/config/mqtt.js
const fs = require("fs");
const path = require("path");

module.exports = {
  host: process.env.AWS_IOT_ENDPOINT,
  port: 8883,
  protocol: "mqtts",
  protocolVersion: 5,
  keyPath: path.join(__dirname, "..", "certs", "private.pem.key"),
  certPath: path.join(__dirname, "..", "certs", "certificate.pem.crt"),
  caPath: path.join(__dirname, "..", "certs", "root-CA.crt"),
  clientId: `mqtt_${Math.random().toString(16).slice(3)}`,
};
