import Notification from "../models/notification.model.js";

// Get notifications for current user
export const getNotifications = async (req, res) => {
    try {
        const userId = req.user.userId;
        const notifications = await Notification.find({ recipient: userId })
            .sort({ createdAt: -1 })
            .limit(50); // Get last 50
        res.status(200).json(notifications);
    } catch (error) {
        res.status(500).json({ message: "Error fetching notifications" });
    }
};

// Mark a single notification as read
export const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        await Notification.findByIdAndUpdate(id, { isRead: true });
        res.status(200).json({ message: "Marked as read" });
    } catch (error) {
        res.status(500).json({ message: "Error marking as read" });
    }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.userId;
        await Notification.updateMany({ recipient: userId, isRead: false }, { isRead: true });
        res.status(200).json({ message: "All marked as read" });
    } catch (error) {
        res.status(500).json({ message: "Error marking all read" });
    }
};

// Clear all notifications
export const clearNotifications = async (req, res) => {
    try {
        const userId = req.user.userId;
        await Notification.deleteMany({ recipient: userId });
        res.status(200).json({ message: "Notifications cleared" });
    } catch (error) {
        res.status(500).json({ message: "Error clearing notifications" });
    }
};
