const express = require("express");
const slotRoutes = require("./routes/slotRoutes");

const app = express();
app.use(express.json());
app.use("/api", slotRoutes);

module.exports = app;
