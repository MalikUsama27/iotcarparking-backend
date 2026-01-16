const mongoose = require("mongoose");

// Cache the connection to reuse in serverless environments
let cachedConnection = null;

async function connectDB(uri) {
  // If already connected, return the existing connection
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }

  try {
    // Close existing connection if any
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }

    const connection = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    cachedConnection = connection;
    console.log("MongoDB connected");
    return connection;
  } catch (err) {
    console.error("MongoDB error:", err.message);
    // Don't exit in serverless environments (Netlify, AWS Lambda, Vercel, etc.)
    if (process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.VERCEL) {
      throw err;
    }
    // Only exit in traditional Node.js environments
    process.exit(1);
  }
}

module.exports = connectDB;
