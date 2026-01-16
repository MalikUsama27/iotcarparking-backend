const UsedNonce = require("../models/UsedNonce");

const ALLOWED_CLOCK_SKEW_MS = Number(process.env.ALLOWED_CLOCK_SKEW_MS || 120000);
const NONCE_TTL_MS = Number(process.env.NONCE_TTL_MS || 600000);

module.exports = async function replayProtection(req, res, next) {
  try {
    const deviceId = req.header("x-device-id") || "postman-device";
    const { timestamp, nonce } = req.body;
    const now = Date.now();

    // Validate required fields
    if (!timestamp) {
      return res.status(400).json({ 
        error: "Timestamp required",
        message: "Please include 'timestamp' in the request body (current time in milliseconds)"
      });
    }

    if (!nonce) {
      return res.status(400).json({ 
        error: "Nonce required",
        message: "Please include 'nonce' in the request body (unique identifier for this request)"
      });
    }

    // Validate timestamp is within allowed clock skew (default: 2 minutes)
    const timeDiff = Math.abs(now - timestamp);
    if (timeDiff > ALLOWED_CLOCK_SKEW_MS) {
      const allowedMinutes = ALLOWED_CLOCK_SKEW_MS / 60000;
      return res.status(409).json({ 
        error: "Timestamp invalid",
        message: `Timestamp must be within ${allowedMinutes} minutes of server time. Current server time: ${now}, Your timestamp: ${timestamp}, Difference: ${Math.round(timeDiff / 1000)} seconds`
      });
    }

    // Check if database is available
    const mongoose = require("mongoose");
    const isDbConnected = mongoose.connection.readyState === 1;
    
    if (!isDbConnected) {
      // If database is not connected, check if MONGO_URI is set
      if (!process.env.MONGO_URI) {
        // Database not configured - skip replay protection for now
        // In production, you might want to require DB for security
        console.warn("Database not configured - skipping replay protection");
        req.deviceId = deviceId;
        return next();
      } else {
        // Database configured but not connected - try to connect
        const connectDB = require("../config/db");
        try {
          await connectDB(process.env.MONGO_URI);
        } catch (dbError) {
          console.error("Failed to connect to database for replay protection:", dbError.message);
          return res.status(503).json({ 
            error: "Database connection failed",
            message: "Unable to verify replay protection. Please ensure MongoDB is configured and accessible."
          });
        }
      }
    }

    // Save nonce to database for replay protection
    try {
      const expiresAt = new Date(now + NONCE_TTL_MS);
      await UsedNonce.create({ deviceId, nonce, ts: timestamp, expiresAt });
    } catch (dbError) {
      if (dbError.code === 11000) {
        // Duplicate nonce detected
        return res.status(409).json({ error: "Replay detected" });
      }
      // Other database errors
      console.error("Database error in replay protection:", dbError.message);
      return res.status(503).json({ 
        error: "Database error",
        message: `Failed to save nonce: ${dbError.message}`
      });
    }

    req.deviceId = deviceId;
    next();
  } catch (err) {
    // Catch any other unexpected errors
    console.error("Unexpected error in replay protection:", err);
    res.status(500).json({ 
      error: "Replay protection error",
      message: err.message || "An unexpected error occurred"
    });
  }
};
