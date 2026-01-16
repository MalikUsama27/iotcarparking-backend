require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");

connectDB(process.env.MONGO_URI);

app.listen(process.env.PORT, () => {
  console.log("Server running on port " + process.env.PORT);
});
