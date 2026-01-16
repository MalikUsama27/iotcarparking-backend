const express = require("express");
const slotRoutes = require("./routes/slotRoutes");

const app = express();
app.use(express.json());

// Root route to verify server is running
app.get("/", (req, res) => {
  res.json({ 
    message: "IoT Car Parking Backend API is running",
    endpoints: {
      "POST /api/slot-update": "Update slot status",
      "GET /api/slots": "Get all slots"
    }
  });
});

app.use("/api", slotRoutes);

module.exports = app;
