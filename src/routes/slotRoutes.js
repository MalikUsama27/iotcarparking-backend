const express = require("express");
const Slot = require("../models/Slot");
const replayProtection = require("../middleware/replayProtection");

const router = express.Router();

router.post("/slot-update", replayProtection, async (req, res) => {
  const { slotId, status, timestamp, nonce } = req.body;

  // Validate status
  if (status && !["FREE", "OCCUPIED"].includes(status)) {
    return res.status(400).json({ error: "Invalid status. Must be 'FREE' or 'OCCUPIED'" });
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
}); 

router.get("/slots", async (req, res) => {
  const slots = await Slot.find();
  
  // If database is empty, return default slots with status "FREE"
  if (slots.length === 0) {
    const defaultSlotCount = parseInt(process.env.DEFAULT_SLOT_COUNT || "10");
    const defaultSlots = [];
    
    for (let i = 1; i <= defaultSlotCount; i++) {
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
  
  res.json(slots);
});

module.exports = router;
