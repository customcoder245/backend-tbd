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




// import mongoose from 'mongoose';

import dotenv from 'dotenv';
import connectDB from "./db/index.js";
import { app } from './app.js';  // Import your Express app
import cron from 'node-cron';   // Import the cron package
import User from './models/user.model.js';  // Import the User model

dotenv.config({
    path: './.env',  
    quiet: true      
});

connectDB()
.then(() => {
    app.listen(process.env.PORT || 3000, () => {
        console.log(`Server is running at port : ${process.env.PORT}`);
    });

    // Run the cron job to clean expired users every minute
    cron.schedule('* * * * *', async () => {
        const expiredUsers = await User.find({
            emailVerificationExpires: { $lt: Date.now() },  // Check if verification has expired
            profileCompleted: false  // Ensure profile is not completed
        });

        if (expiredUsers.length > 0) {
            await User.deleteMany({
                _id: { $in: expiredUsers.map(user => user._id) }
            });
            console.log(`${expiredUsers.length} expired users removed.`);
        }
    });
})
.catch((err) => {
    console.log("MONGO db connection failed !!! ", err);
});



// Add this in your index.js or server.js file
// mongoose.connection.once("open", async () => {
//   try {
//     await mongoose.connection.db.collection("users").dropIndex("orgName_1");
//     console.log("✅ Successfully dropped the unique orgName index.");
//   } catch (error) {
//     console.log("ℹ️ Index orgName_1 not found or already deleted.");
//   }
// });