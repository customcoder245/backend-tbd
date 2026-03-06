import mongoose from "mongoose";

const connectDB = async () => {
  // If already connected, do not create a new connection or pool
  if (mongoose.connection.readyState >= 1) {
    console.log("MongoDB is already connected");
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URL, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    // Do NOT call process.exit(1) in serverless — it kills the function
    throw error;
  }
};

export default connectDB;