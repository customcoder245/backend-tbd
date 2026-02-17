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


