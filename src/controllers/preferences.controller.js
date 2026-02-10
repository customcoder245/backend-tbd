import User from "../models/user.model.js";

export const updateNotificationPreferences = async (req, res) => {
    try {
        const { system, email } = req.body;
        const user = await User.findById(req.user.userId);

        if (!user) return res.status(404).json({ message: "User not found" });

        // Initialize if undefined (migration for old users)
        if (!user.notificationPreferences) {
            user.notificationPreferences = { system: true, email: true };
        }

        if (system !== undefined) user.notificationPreferences.system = system;
        if (email !== undefined) user.notificationPreferences.email = email;

        await user.save();

        res.status(200).json({
            message: "Notification preferences updated successfully",
            preferences: user.notificationPreferences
        });
    } catch (error) {
        console.error("Error updating notification preferences:", error);
        res.status(500).json({ message: "Error updating preferences" });
    }
};
