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
  
  // Debug: Log available env vars (without sensitive data)
  console.log("Environment check - MONGO_URI present:", !!process.env.MONGO_URI);
  console.log("Environment check - Available env vars:", Object.keys(process.env).filter(k => k.includes("MONGO") || k.includes("NETLIFY")));
  
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI environment variable is not set. Please configure it in Netlify dashboard: Site settings > Environment variables");
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
  
  // Let routes handle their own DB connections gracefully
  // This allows routes to return default data when DB is not available
  return handler(event, context);
};
