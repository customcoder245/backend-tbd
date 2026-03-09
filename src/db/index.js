import mongoose from "mongoose";

let isConnected = false;
let connectionPromise = null;

const connectDB = async () => {
  if (isConnected || mongoose.connection.readyState >= 1) {
    console.log("MongoDB is already connected");
    return;
  }

  if (connectionPromise) {
    console.log("MongoDB connection is already in progress...");
    await connectionPromise;
    return;
  }

  try {
    console.log("Initializing new MongoDB connection...");
    connectionPromise = mongoose.connect(process.env.MONGODB_URL, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });

    await connectionPromise;
    isConnected = true;
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    connectionPromise = null; // reset promise to allow retries
    throw error;
  }
};

export default connectDB;