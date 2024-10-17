// services/mqttService.js
const mqtt = require("mqtt");
const fs = require("fs");
const mqttConfig = require("../config/mqtt");
const EventsController = require("../controllers/deviceControllers/eventsController");
const Esp32Controller = require("../controllers/deviceControllers/esp32Controller");
const ConfigController = require("../controllers/deviceControllers/configController");

class MqttService {
  constructor() {
    this.client = null;
    this.topics = ["apm/server", "esp32/data", "apm/config"];
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 5000; // 5 seconds
  }

  async connect() {
    try {
      this.verifyCertificates();

      const options = {
        ...mqttConfig,
        key: fs.readFileSync(mqttConfig.keyPath),
        cert: fs.readFileSync(mqttConfig.certPath),
        ca: fs.readFileSync(mqttConfig.caPath),
        rejectUnauthorized: true,
        keepalive: 60,
        reconnectPeriod: 1000,
        connectTimeout: 30000,
        clean: true,
      };

      console.log("Attempting to connect to MQTT broker:", mqttConfig.host);

      return new Promise((resolve, reject) => {
        this.client = mqtt.connect(
          `mqtts://${mqttConfig.host}:${mqttConfig.port}`,
          options
        );

        this.client.on("connect", () => {
          console.log("Successfully connected to MQTT broker");
          this.reconnectAttempts = 0;
          this.subscribe();
          resolve();
        });

        this.client.on("error", (error) => {
          console.error("MQTT connection error:", error.message);
          this.handleConnectionError(error);
          reject(error);
        });

        this.client.on("offline", () => {
          console.log("MQTT client is offline");
          this.handleOffline();
        });

        this.client.on("reconnect", () => {
          console.log("Attempting to reconnect to MQTT broker...");
        });

        this.client.on("message", this.handleMessage.bind(this));
      });
    } catch (error) {
      console.error("Failed to initialize MQTT connection:", error);
      throw error;
    }
  }

  verifyCertificates() {
    const certFiles = [
      { path: mqttConfig.keyPath, name: "Private Key" },
      { path: mqttConfig.certPath, name: "Certificate" },
      { path: mqttConfig.caPath, name: "CA Certificate" },
    ];

    certFiles.forEach(({ path, name }) => {
      if (!fs.existsSync(path)) {
        throw new Error(`${name} not found at path: ${path}`);
      }
      try {
        fs.accessSync(path, fs.constants.R_OK);
      } catch (error) {
        throw new Error(`${name} is not readable: ${error.message}`);
      }
    });
  }

  handleConnectionError(error) {
    this.reconnectAttempts++;
    console.error(
      `Connection attempt ${this.reconnectAttempts} failed:`,
      error.message
    );

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(
        "Max reconnection attempts reached. Please check your configuration and certificates."
      );
      this.disconnect();
    }
  }

  handleOffline() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      setTimeout(() => {
        console.log("Attempting to reconnect...");
        this.connect().catch((error) => {
          console.error("Reconnection failed:", error.message);
        });
      }, this.reconnectInterval);
    }
  }

  subscribe() {
    this.topics.forEach((topic) => {
      this.client.subscribe(topic, { qos: 1 }, (err) => {
        if (err) {
          console.error(`Error subscribing to ${topic}:`, err);
        } else {
          console.log(`Successfully subscribed to ${topic}`);
        }
      });
    });
  }

  async handleMessage(topic, message) {
    let payload;
    try {
      payload = JSON.parse(message.toString());
      console.log(`Received message on topic ${topic}:`, payload);

      switch (topic) {
        case "apm/server":
          await EventsController.saveEventData(payload);
          break;
        case "esp32/data":
          await Esp32Controller.saveEsp32Data(payload);
          break;
        case "apm/config":
          await ConfigController.saveConfigData(payload);
          break;
        default:
          console.warn(`Unhandled topic: ${topic}`);
      }
    } catch (error) {
      console.error(`Error processing message for topic ${topic}:`, error);
      console.error("Problem message:", message.toString());
    }
  }

  disconnect() {
    if (this.client && this.client.connected) {
      console.log("Disconnecting from MQTT broker...");
      this.client.end(true, {}, () => {
        console.log("Successfully disconnected from MQTT broker");
      });
    }
  }

  publish(topic, message) {
    return new Promise((resolve, reject) => {
      if (!this.client || !this.client.connected) {
        reject(new Error("MQTT client is not connected"));
        return;
      }

      this.client.publish(
        topic,
        JSON.stringify(message),
        { qos: 1 },
        (error) => {
          if (error) {
            console.error(`Error publishing to ${topic}:`, error);
            reject(error);
          } else {
            console.log(`Successfully published to ${topic}`);
            resolve();
          }
        }
      );
    });
  }
}

module.exports = new MqttService();
