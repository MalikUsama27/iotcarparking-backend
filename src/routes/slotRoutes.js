const express = require("express");
const Slot = require("../models/Slot");
const replayProtection = require("../middleware/replayProtection");
const connectDB = require("../config/db");
require("dotenv").config();

const router = express.Router();

router.post("/slot-update", replayProtection, async (req, res) => {
  
  await connectDB(process.env.MONGO_URI);
  const { slotId, status, timestamp, nonce } = req.body;

  const slot = await Slot.findOneAndUpdate(
    { slotId },
    { status, timestamp, nonce, deviceId: req.deviceId },
    { upsert: true, new: true }
  );

  res.json({ ok: true, slot });
});

router.get("/slots", async (req, res) => {
  await connectDB(process.env.MONGO_URI);
  const slots = await Slot.find();
  res.json(slots);
});

module.exports = router;
