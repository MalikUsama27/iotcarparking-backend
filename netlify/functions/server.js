const serverless = require("serverless-http");
require("dotenv").config();
const app = require("../../src/app");
const connectDB = require("../../src/config/db");

// Connect to MongoDB
let isConnected = false;

async function ensureConnection() {
  // Check if already connected
  const mongoose = require("mongoose");
  if (mongoose.connection.readyState === 1) {
    isConnected = true;
    return;
  }
  
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI environment variable is not set");
  }
  
  if (!isConnected) {
    try {
      await connectDB(process.env.MONGO_URI);
      isConnected = true;
    } catch (error) {
      console.error("MongoDB connection error:", error);
      // Reset flag so we can retry on next request
      isConnected = false;
      throw error;
    }
  }
}

// Ensure connection before handling requests
const handler = serverless(app, {
  binary: ["image/*", "application/pdf"],
});

module.exports.handler = async (event, context) => {
  // Set callbackWaitsForEmptyEventLoop to false for better performance
  context.callbackWaitsForEmptyEventLoop = false;
  
  // Ensure MongoDB connection
  try {
    await ensureConnection();
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    return {
      statusCode: 503,
      body: JSON.stringify({ 
        error: "Database connection failed",
        message: error.message 
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    };
  }
  
  return handler(event, context);
};
