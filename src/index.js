import "./config/env.config.js";
import dns from "dns";
import connectDB from "./db/index.js";
import { app } from "./app.js";
import cron from "node-cron";
import User from "./models/user.model.js";
import BenefitsRealization from "./models/benefitsRealization.model.js";
import { sendNotificationEmail } from "./utils/sendEmail.js";
import mongoose from "mongoose";

// Use Google DNS override only in development to fix local 'querySrv ECONNREFUSED' issues
if (process.env.NODE_ENV !== "production") {
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
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
        const collection = db.collection("assessments");
        const indexes = await collection.indexes();
        const hasInvitationIndex = indexes.some((idx) => idx.name === "invitationId_1");

        if (hasInvitationIndex) {
          await collection.dropIndex("invitationId_1");
          console.log("Fixed: Removed unique constraint from invitationId.");
        }
      } catch (err) {
        console.log("Index cleanup status:", err.message);
      }

      // Run the cron job to clean expired users every minute
      cron.schedule("* * * * *", async () => {
        const expiredUsers = await User.find({
          emailVerificationExpires: { $lt: Date.now() },
          profileCompleted: false
        });

        if (expiredUsers.length > 0) {
          await User.deleteMany({
            _id: { $in: expiredUsers.map((user) => user._id) }
          });
          console.log(`${expiredUsers.length} expired users removed.`);
        }
      });

      // Run daily at 8:00 AM: Automated 2-day pre-checkpoint email alert to Benefits Owner / Admin
      cron.schedule("0 8 * * *", async () => {
        try {
          const now = new Date();
          const twoDaysOutStart = new Date(now);
          twoDaysOutStart.setDate(now.getDate() + 2);
          twoDaysOutStart.setHours(0, 0, 0, 0);
          const twoDaysOutEnd = new Date(twoDaysOutStart);
          twoDaysOutEnd.setHours(23, 59, 59, 999);

          const docs = await BenefitsRealization.find({});
          for (const doc of docs) {
            let modified = false;
            for (const cp of doc.checkpoints || []) {
              if (
                cp.dueDate &&
                !cp.alertSent &&
                cp.status !== "COMPLETED" &&
                cp.dueDate >= twoDaysOutStart &&
                cp.dueDate <= twoDaysOutEnd
              ) {
                const recipientEmail = cp.alertEmail || cp.ownerEmail || "sdesouza@langara.ca";
                const title = `Reminder: Benefits Checkpoint ${cp.checkpointNumber} (${cp.name}) in 2 Days`;
                const message = `Upcoming Review Gate for ${doc.orgName} — ${doc.waveName}. Checkpoint ${cp.checkpointNumber} (${cp.name}) is scheduled for ${new Date(cp.dueDate).toDateString()}. Please contact Benefits Owner ${cp.ownerName || "Department Lead"} (${cp.ownerEmail || "N/A"}) to request the required M365 reports and survey data.`;
                await sendNotificationEmail(
                  { email: recipientEmail, firstName: "Suzanna" },
                  title,
                  message
                );
                cp.alertSent = true;
                modified = true;
                console.log(
                  `[CHECKPOINT ALERT] Sent 2-day reminder for ${doc.orgName} CP${cp.checkpointNumber} to ${recipientEmail}`
                );
              }
            }
            if (modified) await doc.save();
          }
        } catch (err) {
          console.error("[CHECKPOINT CRON ERROR]", err.message);
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
