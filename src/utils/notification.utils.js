import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";

export const createNotification = async ({ recipient, title, message, type = "info", link = null }) => {
    try {
        return await Notification.create({
            recipient,
            title,
            message,
            type,
            link
        });
    } catch (error) {
        console.error("Error creating notification:", error);
    }
};

export const notifySuperAdmins = async ({ title, message, type = "info", excludeUser = null }) => {
    try {
        const superAdmins = await User.find({ role: "superAdmin" });
        const notifications = superAdmins
            .filter(admin => !excludeUser || admin._id.toString() !== excludeUser.toString())
            .map(admin => ({
                recipient: admin._id,
                title,
                message,
                type
            }));

        if (notifications.length > 0) {
            await Notification.insertMany(notifications);
        }
    } catch (error) {
        console.error("Error notifying super admins:", error);
    }
};

export const notifyOrgAdmins = async ({ orgName, title, message, type = "info", excludeUser = null }) => {
    try {
        if (!orgName) return;
        // Notify Admins, Leaders, and Managers of the organization
        const orgAdmins = await User.find({
            role: { $in: ["admin", "leader", "manager"] },
            orgName
        });

        const notifications = orgAdmins
            .filter(admin => !excludeUser || admin._id.toString() !== excludeUser.toString())
            .map(admin => ({
                recipient: admin._id,
                title,
                message,
                type
            }));

        if (notifications.length > 0) {
            await Notification.insertMany(notifications);
        }
    } catch (error) {
        console.error("Error notifying org admins:", error);
    }
};
