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

/**
 * Hierarchical Notification System
 * Notifies the immediate superiors of a user based on role and department.
 */
export const notifyHierarchy = async ({ initiatorId, title, message, type = "info" }) => {
    try {
        const initiator = await User.findById(initiatorId);
        if (!initiator) return;

        const { role, orgName, department } = initiator;
        if (!orgName) return;

        const superiors = [];

        // 1. Determine who needs to be notified based on role hierarchy
        if (role === "employee") {
            // Superior levels: manager, leader, admin
            const query = {
                orgName,
                role: { $in: ["manager", "leader", "admin"] }
            };
            // For managers and leaders, restrict to same department if available
            const users = await User.find(query);
            users.forEach(user => {
                if (user.role === "admin") {
                    superiors.push(user);
                } else if (department && user.department === department) {
                    superiors.push(user);
                }
            });
        } else if (role === "manager") {
            // Superior levels: leader, admin
            const query = {
                orgName,
                role: { $in: ["leader", "admin"] }
            };
            const users = await User.find(query);
            users.forEach(user => {
                if (user.role === "admin") {
                    superiors.push(user);
                } else if (department && user.department === department) {
                    superiors.push(user);
                }
            });
        } else if (role === "leader") {
            // Superior levels: admin
            const admins = await User.find({ orgName, role: "admin" });
            superiors.push(...admins);
        } else if (role === "admin") {
            // Superior levels: superAdmin
            await notifySuperAdmins({ title, message, type });
            return;
        }

        // 2. Filter unique superiors and dispatch notifications
        const systemNotifications = [];
        const emailRecipients = [];
        const seenIds = new Set();

        superiors.forEach(sup => {
            if (seenIds.has(sup._id.toString())) return;
            seenIds.add(sup._id.toString());

            if (shouldNotifySystem(sup)) {
                systemNotifications.push({
                    recipient: sup._id,
                    title,
                    message,
                    type
                });
            }

            if (shouldNotifyEmail(sup)) {
                emailRecipients.push(sup);
            }
        });

        if (systemNotifications.length > 0) {
            await Notification.insertMany(systemNotifications);
        }

        if (emailRecipients.length > 0) {
            await Promise.all(emailRecipients.map(sup => sendNotificationEmail(sup, title, message)));
        }

    } catch (error) {
        console.error("Error in hierarchical notification:", error);
    }
};

