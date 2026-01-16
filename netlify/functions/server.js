const serverless = require("serverless-http");
require("dotenv").config();
const app = require("../../src/app");
const connectDB = require("../../src/config/db");

// Connect to MongoDB
let isConnected = false;

async function ensureConnection() {
  if (!isConnected && process.env.MONGO_URI) {
    try {
      await connectDB(process.env.MONGO_URI);
      isConnected = true;
    } catch (error) {
      console.error("MongoDB connection error:", error);
    }
  }
}

// Ensure connection before handling requests
const handler = serverless(app, {
  binary: ["image/*", "application/pdf"],
});

module.exports.handler = async (event, context) => {
  // Ensure MongoDB connection
  await ensureConnection();
  
  // Set callbackWaitsForEmptyEventLoop to false for better performance
  context.callbackWaitsForEmptyEventLoop = false;
  
  return handler(event, context);
};
