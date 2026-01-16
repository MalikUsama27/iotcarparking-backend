const mongoose = require("mongoose");

const UsedNonceSchema = new mongoose.Schema({
  deviceId: { type: String, required: true },
  nonce: { type: String, required: true },
  ts: { type: Number, required: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } }
}, { versionKey: false });

UsedNonceSchema.index({ deviceId: 1, nonce: 1 }, { unique: true });

module.exports = mongoose.model("UsedNonce", UsedNonceSchema, "used_nonces");
