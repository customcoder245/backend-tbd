import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";
import { sendNotificationEmail } from "./sendEmail.js";

// Helper to check preferences (Default to TRUE if undefined)
const shouldNotifySystem = (user) => user.notificationPreferences?.system !== false;
const shouldNotifyEmail = (user) => user.notificationPreferences?.email === true;

export const createNotification = async ({ recipient, title, message, type = "info", link = null }) => {
    try {
        const user = await User.findById(recipient);
        if (!user) return;

        // 1. System Notification
        if (shouldNotifySystem(user)) {
            await Notification.create({
                recipient,
                title,
                message,
                type,
                link
            });
        }

        // 2. Email Notification
        if (shouldNotifyEmail(user)) {
            await sendNotificationEmail(user, title, message);
        }

    } catch (error) {
        console.error("Error creating notification:", error);
    }
};

export const notifySuperAdmins = async ({ title, message, type = "info", excludeUser = null }) => {
    try {
        const superAdmins = await User.find({ role: "superAdmin" });

        const systemNotifications = [];
        const emailRecipients = [];

        superAdmins.forEach(admin => {
            if (excludeUser && admin._id.toString() === excludeUser.toString()) return;

            if (shouldNotifySystem(admin)) {
                systemNotifications.push({
                    recipient: admin._id,
                    title,
                    message,
                    type
                });
            }

            if (shouldNotifyEmail(admin)) {
                emailRecipients.push(admin);
            }
        });

        if (systemNotifications.length > 0) {
            await Notification.insertMany(systemNotifications);
        }

        // Send emails
        await Promise.all(emailRecipients.map(admin => sendNotificationEmail(admin, title, message)));

    } catch (error) {
        console.error("Error notifying super admins:", error);
    }
};

export const notifyOrgAdmins = async ({ orgName, title, message, type = "info", excludeUser = null }) => {
    try {
        if (!orgName) return;

        const orgAdmins = await User.find({
            role: { $in: ["admin", "leader", "manager"] },
            orgName
        });

        const systemNotifications = [];
        const emailRecipients = [];

        orgAdmins.forEach(admin => {
            if (excludeUser && admin._id.toString() === excludeUser.toString()) return;

            if (shouldNotifySystem(admin)) {
                systemNotifications.push({
                    recipient: admin._id,
                    title,
                    message,
                    type
                });
            }

            if (shouldNotifyEmail(admin)) {
                emailRecipients.push(admin);
            }
        });

        if (systemNotifications.length > 0) {
            await Notification.insertMany(systemNotifications);
        }

        // Send emails
        await Promise.all(emailRecipients.map(admin => sendNotificationEmail(admin, title, message)));

    } catch (error) {
        console.error("Error notifying org admins:", error);
    }
};
