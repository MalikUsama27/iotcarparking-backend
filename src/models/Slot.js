const mongoose = require("mongoose");

const SlotSchema = new mongoose.Schema({
  slotId: { type: String, required: true, unique: true },
  status: { type: String, enum: ["FREE", "OCCUPIED"], required: true },
  updatedAt: { type: Date, default: Date.now },
  deviceId: String,
  timestamp: Number,
  nonce: String
}, { versionKey: false });

module.exports = mongoose.model("Slot", SlotSchema, "slots");
