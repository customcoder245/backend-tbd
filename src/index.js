import dotenv from 'dotenv';
import dns from 'dns';
import connectDB from "./db/index.js";
import { app } from './app.js';
import cron from 'node-cron';
import User from './models/user.model.js';

dotenv.config({
    path: './.env',
    quiet: true
});

// Use Google DNS override only in development to fix local 'querySrv ECONNREFUSED' issues
if (process.env.NODE_ENV !== 'production') {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
}

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


