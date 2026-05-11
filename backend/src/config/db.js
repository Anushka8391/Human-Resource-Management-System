const mongoose = require("mongoose");

let cachedConnectionPromise;

const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      return mongoose.connection;
    }

    if (!cachedConnectionPromise) {
      cachedConnectionPromise = mongoose.connect(process.env.MONGO_URI);
    }

    await cachedConnectionPromise;
    console.log("MongoDB connected");
    return mongoose.connection;
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    cachedConnectionPromise = null;
    throw error;
  }
};

module.exports = connectDB;
