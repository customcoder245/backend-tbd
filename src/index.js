// import dotenv from 'dotenv';
// import connectDB from './db/index.js';
// import { app } from './app.js';  // Import your Express app

// dotenv.config({
//   path: './env',  // Path to the .env file
//   quiet: true      // Suppresses warning messages
// });

// // Connect to MongoDB
// connectDB()
//   .then(() => {
//     console.log("MongoDB connected successfully.");
//   })
//   .catch((err) => {
//     console.error("MongoDB connection failed:", err);
//   });

// // Export the serverless function for Vercel
// export default (req, res) => {
//   app(req, res);  // Pass the request and response to the Express app
// };




import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from "./db/index.js";
import { app } from './app.js';
import cron from 'node-cron';
import User from './models/user.model.js';

dotenv.config({
    path: './.env',  
    quiet: true      
});

connectDB()
.then(() => {
    // 1. Start the Server
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        console.log(`🚀 Server is running at port : ${port}`);
    });

    // 2. Index Cleanup: Stop Invitations from auto-deleting
    // We use .once to ensure this only attempts to run one time after connection
    mongoose.connection.once("open", async () => {
        try {
            const collection = mongoose.connection.db.collection("invitations");
            // This removes the TTL (Time To Live) rule so invitations stay in DB
            await collection.dropIndex("expiredAt_1");
            console.log("✅ SUCCESS: Auto-delete rule removed for Invitations.");
        } catch (err) {
            console.log("ℹ️ Invitation TTL Index already removed or not found.");
        }
    });

    // 3. Cron Job: Clean up unverified users every minute
    cron.schedule('* * * * *', async () => {
        try {
            const result = await User.deleteMany({
                emailVerificationExpires: { $lt: Date.now() },
                profileCompleted: false
            });

            if (result.deletedCount > 0) {
                console.log(`🧹 Cleanup: ${result.deletedCount} unverified users removed.`);
            }
        } catch (error) {
            console.error("❌ Cron Job Error:", error);
        }
    });
})
.catch((err) => {
    console.log("❌ MONGO db connection failed !!! ", err);
});