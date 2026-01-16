const UsedNonce = require("../models/UsedNonce");

const ALLOWED_CLOCK_SKEW_MS = Number(process.env.ALLOWED_CLOCK_SKEW_MS || 120000);
const NONCE_TTL_MS = Number(process.env.NONCE_TTL_MS || 600000);

module.exports = async function replayProtection(req, res, next) {
  try {
    const deviceId = req.header("x-device-id") || "postman-device";
    const { timestamp, nonce } = req.body;
    const now = Date.now();

    // Validate timestamp exists
    if (!timestamp) {
      return res.status(400).json({ 
        error: "Timestamp required",
        message: "Please include 'timestamp' in the request body (current time in milliseconds)"
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
