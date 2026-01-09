// if you have to add new user just use command "node .\src\scripts\seedAdmin.js" that will push the data to the mongodb databse 

import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/user.model.js";

dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);

    const adminExists = await User.findOne({ role: "admin" });

    if (adminExists) {
      console.log("Admin already exists");
      process.exit(0);
    }

    // Use environment variables for email and password
    const email = process.env.EMAIL_USER;
    const password = process.env.EMAIL_APP_PASSWORD;

    await User.create({
      email: email,
      password: password, // plain text for now (as per your setup)
      role: "admin",
      isActive: true,
      isApproved: true,
      profileCompleted: true,
      isEmailVerified: true
    });

    console.log("Admin created successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error creating admin:", error);
    process.exit(1);
  }
};

seedAdmin();
