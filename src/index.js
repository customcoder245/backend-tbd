import './config/env.config.js';
import dns from 'dns';
import connectDB from "./db/index.js";
import { app } from './app.js';
import cron from 'node-cron';
import User from './models/user.model.js';
import mongoose from 'mongoose';



// Use Google DNS override only in development to fix local 'querySrv ECONNREFUSED' issues
if (process.env.NODE_ENV !== 'production') {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
}

// Start the server ONLY if we are NOT on Vercel
if (!process.env.VERCEL) {
    const port = process.env.PORT || 8000;

    // Connect to DB and run migrations/server locally
    connectDB()
        .then(async () => {
            // --- DATABASE CLEANUP (Local Only) ---
            try {
                const db = mongoose.connection.db;
                const collection = db.collection('assessments');
                const indexes = await collection.indexes();
                const hasInvitationIndex = indexes.some(idx => idx.name === 'invitationId_1');

                if (hasInvitationIndex) {
                    await collection.dropIndex('invitationId_1');
                    console.log("Fixed: Removed unique constraint from invitationId.");
                }
            } catch (err) {
                console.log("Index cleanup status:", err.message);
            }

            // Run the cron job to clean expired users every minute
            cron.schedule('* * * * *', async () => {
                const expiredUsers = await User.find({
                    emailVerificationExpires: { $lt: Date.now() },
                    profileCompleted: false
                });

                if (expiredUsers.length > 0) {
                    await User.deleteMany({
                        _id: { $in: expiredUsers.map(user => user._id) }
                    });
                    console.log(`${expiredUsers.length} expired users removed.`);
                }
            });

            app.listen(port, () => {
                console.log(`⚙️  Server is running at port : ${port}`);
            });
        })
        .catch((err) => {
            console.log("MONGO db connection failed !!! ", err);
        });
}

export default app;
