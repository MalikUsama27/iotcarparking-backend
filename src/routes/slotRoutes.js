const express = require("express");
const Slot = require("../models/Slot");
const replayProtection = require("../middleware/replayProtection");
const connectDB = require("../config/db");
require("dotenv").config();

const router = express.Router();

router.post("/slot-update", replayProtection, async (req, res) => {
  const { slotId, status, timestamp, nonce } = req.body;

  // Validate status
  if (status && !["FREE", "OCCUPIED"].includes(status)) {
    return res.status(400).json({ error: "Invalid status. Must be 'FREE' or 'OCCUPIED'" });
  }

  try {
    // Ensure database connection
    if (process.env.MONGO_URI) {
      const mongoose = require("mongoose");
      if (mongoose.connection.readyState !== 1) {
        await connectDB(process.env.MONGO_URI);
      }
    } else {
      return res.status(503).json({ 
        error: "Database not configured",
        message: "MONGO_URI environment variable is not set. Please configure it in Netlify dashboard."
      });
    }

    const slot = await Slot.findOneAndUpdate(
      { slotId },
      { 
        status, 
        timestamp, 
        nonce, 
        deviceId: req.deviceId,
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    res.json({ ok: true, slot });
  } catch (error) {
    console.error("Database error:", error.message);
    return res.status(503).json({ 
      error: "Database connection failed",
      message: error.message
    });
  }
}); 

router.get("/slots", async (req, res) => {
  try {
    // Try to connect to database if not connected
    if (process.env.MONGO_URI) {
      const mongoose = require("mongoose");
      if (mongoose.connection.readyState !== 1) {
        await connectDB(process.env.MONGO_URI);
      }
    } else {
      // No MONGO_URI set, return default slots
      return getDefaultSlots(res, 5);
    }

    // Try to get slots from database
    const slots = await Slot.find();
    
    // If database is empty, return default slots with status "FREE"
    if (slots.length === 0) {
      return getDefaultSlots(res, 5);
    }
    
    res.json(slots);
  } catch (error) {
    // If database connection fails, return default slots
    console.error("Database error, returning default slots:", error.message);
    return getDefaultSlots(res, 5);
  }
});

// Helper function to return default slots
function getDefaultSlots(res, count) {
  const defaultSlots = [];
  
  for (let i = 1; i <= count; i++) {
    defaultSlots.push({
      slotId: `slot-${i}`,
      status: "FREE",
      updatedAt: new Date(),
      deviceId: null,
      timestamp: Date.now(),
      nonce: null
    });
  }
  
  return res.json(defaultSlots);
}

module.exports = router;
