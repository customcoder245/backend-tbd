import mongoose from "mongoose";

let isConnected = false;
let connectionPromise = null;

const connectDB = async () => {
  // If already connected, do nothing
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  // Use the cached promise if one exists
  if (connectionPromise) {
    return connectionPromise;
  }

  const mongoUri = process.env.MONGODB_URL;
  if (!mongoUri) {
    throw new Error("MONGODB_URL is not defined. Check your environment variables.");
  }

  connectionPromise = mongoose.connect(mongoUri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  }).then((conn) => {
    console.log("MongoDB connected successfully");
    return conn;
  }).catch((error) => {
    console.error("MongoDB connection failed:", error.message);
    connectionPromise = null;
    throw error;
  });

  return connectionPromise;
};

export default connectDB;