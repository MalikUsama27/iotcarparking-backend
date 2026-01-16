const UsedNonce = require("../models/UsedNonce");

const ALLOWED_CLOCK_SKEW_MS = Number(process.env.ALLOWED_CLOCK_SKEW_MS || 120000);
const NONCE_TTL_MS = Number(process.env.NONCE_TTL_MS || 600000);

module.exports = async function replayProtection(req, res, next) {
  try {
    const deviceId = req.header("x-device-id") || "postman-device";
    const { timestamp, nonce } = req.body;
    const now = Date.now();

    if (Math.abs(now - timestamp) > ALLOWED_CLOCK_SKEW_MS) {
      return res.status(409).json({ error: "Timestamp invalid" });
    }

    const expiresAt = new Date(now + NONCE_TTL_MS);
    await UsedNonce.create({ deviceId, nonce, ts: timestamp, expiresAt });

    req.deviceId = deviceId;
    next();
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "Replay detected" });
    }
    res.status(500).json({ error: "Replay protection error" });
  }
};
