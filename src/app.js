const express = require("express");
const slotRoutes = require("./routes/slotRoutes");

const app = express();
app.use(express.json());

// Root route
app.get("/", (req, res) => {
  res.json({ 
    message: "Welcome to IoT Car Parking"
  });
});

app.use("/api", slotRoutes);

module.exports = app;
